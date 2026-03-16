import { Booking, VehicleHandover } from "../models/booking.model.js";
import { Vehicle, VehicleType } from "../models/vehicle.model.js";
import { Staff, Customer } from "../models/user.model.js";
import { sendNotification } from "../utils/notificationSender.js";

// @route POST /api/handovers/delivery
// @access Private (Chỉ Staff)
export const createDeliveryHandover = async (req, res) => {
  try {
    const {
      booking_id,
      mileage,
      battery_level_percentage,
      notes,
      customer_signature,
    } = req.body;

    // 1. Xác thực Staff đang làm biên bản
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res
        .status(403)
        .json({ message: "Chỉ nhân viên mới được làm biên bản bàn giao." });
    }

    // 2. Tìm Booking
    const booking = await Booking.findById(booking_id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // 3. Kiểm tra trạng thái Booking (Chỉ giao xe khi đơn đã confirmed)
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: `Đơn hàng đang ở trạng thái ${booking.status}, không thể bàn giao xe.`,
      });
    }

    // 3.5. Kiểm tra đã có biên bản giao xe chưa (tránh tạo trùng)
    const existingHandover = await VehicleHandover.findOne({
      booking: booking._id,
      handover_type: "delivery",
    });
    if (existingHandover) {
      return res.status(400).json({
        message: "Đơn này đã có biên bản giao xe rồi.",
      });
    }

    // 4. Lấy thông tin xe hiện tại
    const vehicle = await Vehicle.findById(booking.vehicle);
    if (!vehicle)
      return res
        .status(404)
        .json({ message: "Lỗi: Không tìm thấy dữ liệu xe." });

    // 5. 🟢 TẠO BIÊN BẢN BÀN GIAO (GIAO XE CHO KHÁCH)
    const newHandover = await VehicleHandover.create({
      booking: booking._id,
      vehicle: vehicle._id,
      staff: staff._id,
      handover_type: "delivery", // Loại biên bản: Giao đi
      mileage: mileage || vehicle.current_mileage, // Số km lúc giao
      battery_level_percentage: battery_level_percentage ?? 100, // % pin lúc giao
      notes: notes || "Xe tình trạng bình thường, pin đầy, đủ giấy tờ.",
      confirmed_by_customer: !!customer_signature,
      customer_signature: customer_signature || null,
    });

    // 6. 🟢 CẬP NHẬT TRẠNG THÁI BOOKING & VEHICLE
    // Booking chuyển sang đang trong chuyến đi
    booking.updateStatus("in_progress");
    await booking.save();

    // Xe chuyển sang trạng thái đang cho thuê (Để hệ thống khác không lấy được xe này)
    vehicle.status = "rented";
    await vehicle.save();

    // Populate customer to get User ID
    await booking.populate("customer");
    if (booking.customer && booking.customer.user) {
      await sendNotification({
        recipientId: booking.customer.user,
        title: "Giao xe thành công",
        message: `Xe ${vehicle.license_plate} đã được bàn giao. Chúc quý khách thượng lộ bình an!`,
        type: "vehicle_handover",
        relatedId: newHandover._id,
        relatedModel: "VehicleHandover",
      });
    }

    res.status(201).json({
      success: true,
      message: "Lập biên bản giao xe thành công! Chuyến đi đã bắt đầu.",
      data: {
        handover: newHandover,
        booking_status: booking.status,
        vehicle_status: vehicle.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/handovers/return
// @access Private (Chỉ Staff)
export const createReturnHandover = async (req, res) => {
  try {
    const {
      booking_id,
      return_mileage,
      battery_level_percentage,
      notes,
      penalty_amount,
      customer_signature,
    } = req.body;

    // 1. Xác thực Staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff)
      return res
        .status(403)
        .json({ message: "Chỉ nhân viên mới được làm biên bản nhận xe." });

    // 2. Tìm Booking
    const booking = await Booking.findById(booking_id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    if (booking.status !== "in_progress") {
      return res.status(400).json({
        message: `Đơn hàng đang ở trạng thái ${booking.status}. Chỉ nhận lại xe khi đơn đang in_progress.`,
      });
    }

    // 3. Tìm chiếc xe đang cho thuê
    const vehicle = await Vehicle.findById(booking.vehicle);
    if (!vehicle)
      return res
        .status(404)
        .json({ message: "Lỗi: Không tìm thấy dữ liệu xe." });

    // 3.5. Kiểm tra đã có biên bản trả xe chưa (tránh tạo trùng)
    const existingReturn = await VehicleHandover.findOne({
      booking: booking._id,
      handover_type: "return",
    });
    if (existingReturn) {
      return res.status(400).json({
        message: "Đơn này đã có biên bản trả xe rồi.",
      });
    }

    // 3.6. Validate số Km trả xe
    if (return_mileage == null || return_mileage < 0) {
      return res.status(400).json({
        message: "Vui lòng nhập số Km lúc trả xe hợp lệ.",
      });
    }

    // (Optional) Tìm biên bản lúc Giao xe để đối chiếu số Km
    const deliveryHandover = await VehicleHandover.findOne({
      booking: booking._id,
      handover_type: "delivery",
    });

    if (deliveryHandover && return_mileage < deliveryHandover.mileage) {
      return res.status(400).json({
        message: `Số Km lúc trả (${return_mileage}) không thể nhỏ hơn số Km lúc nhận (${deliveryHandover.mileage}) được! Tua đồng hồ à?`,
      });
    }

    // 4. TẠO BIÊN BẢN NHẬN LẠI XE (RETURN)
    const newHandover = await VehicleHandover.create({
      booking: booking._id,
      vehicle: vehicle._id,
      staff: staff._id,
      handover_type: "return", // Loại biên bản: Nhận về
      mileage: return_mileage,
      battery_level_percentage: battery_level_percentage,
      notes: notes || "Khách trả xe đúng giờ, tình trạng bình thường.",
      confirmed_by_customer: !!customer_signature,
      customer_signature: customer_signature || null,
    });

    // 4.5 TÍNH PHÍ SẠC PIN (CHARGING FEE)
    let charging_fee = 0;
    if (deliveryHandover && battery_level_percentage != null) {
      const batteryUsed =
        deliveryHandover.battery_level_percentage - battery_level_percentage;
      if (batteryUsed > 0) {
        // Lấy thông tin loại xe để tính dung lượng pin & giá sạc
        const vehicleType = await VehicleType.findById(vehicle.vehicle_type);
        if (vehicleType && vehicleType.battery_capacity_kwh) {
          const kwhUsed =
            (batteryUsed / 100) * vehicleType.battery_capacity_kwh;
          const costPerKwh = vehicleType.charging_cost_per_kwh || 3500; // Mặc định 3,500 VND/kWh
          charging_fee = Math.round(kwhUsed * costPerKwh);
        }
      }
    }

    // 5. TÍNH TIỀN CHỐT SỔ (FINAL AMOUNT)
    // final_amount = Tổng tiền thuê + Phí sạc + Phạt (nếu có) - Tiền đã cọc
    const penalty = penalty_amount || 0;
    const final_amount =
      booking.total_amount + charging_fee + penalty - booking.deposit_amount;

    // 6. CẬP NHẬT TRẠNG THÁI BOOKING & VEHICLE
    booking.actual_return_date = new Date(); // Lưu lại thời gian trả xe thực tế
    booking.final_amount = final_amount > 0 ? final_amount : 0; // Số tiền khách còn phải trả thêm
    booking.updateStatus("vehicle_returned"); // Đổi trạng thái: Đã trả xe (Chờ thanh toán nốt)
    await booking.save();

    // Xe được thu hồi về bãi -> Rảnh rỗi đón khách mới
    vehicle.status = "available";
    vehicle.current_mileage = return_mileage; // Cập nhật ODO mới nhất cho xe
    await vehicle.save();

    // Populate customer to get User ID
    await booking.populate("customer");
    if (booking.customer && booking.customer.user) {
      await sendNotification({
        recipientId: booking.customer.user,
        title: "Trả xe thành công",
        message: `Đã nhận xe ${vehicle.license_plate}. Vui lòng thanh toán số dư còn lại (nếu có).`,
        type: "vehicle_return",
        relatedId: newHandover._id,
        relatedModel: "VehicleHandover",
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Nhận lại xe thành công! Vui lòng hướng dẫn khách thanh toán phần còn lại.",
      data: {
        handover: newHandover,
        charging_fee,
        penalty_amount: penalty,
        final_amount_to_pay: booking.final_amount,
        booking_status: booking.status,
        vehicle_status: vehicle.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF: XEM TẤT CẢ BIÊN BẢN BÀN GIAO ====================
// @route GET /api/handovers
// @access Private (Staff)
export const getAllHandovers = async (req, res) => {
  try {
    const { handover_type, booking_id, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (handover_type) {
      if (!["delivery", "return"].includes(handover_type)) {
        return res.status(400).json({
          message: 'handover_type phải là "delivery" hoặc "return".',
        });
      }
      filter.handover_type = handover_type;
    }
    if (booking_id) filter.booking = booking_id;

    const handovers = await VehicleHandover.find(filter)
      .populate({
        path: "booking",
        select: "status rental_type start_date end_date total_amount",
        populate: {
          path: "customer",
          populate: { path: "user", select: "full_name phone" },
        },
      })
      .populate({
        path: "vehicle",
        select: "brand model license_plate",
      })
      .populate({
        path: "staff",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ handover_time: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await VehicleHandover.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: handovers.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: handovers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM CHI TIẾT 1 BIÊN BẢN ====================
// @route GET /api/handovers/:id
// @access Private (Staff)
export const getHandoverById = async (req, res) => {
  try {
    const handover = await VehicleHandover.findById(req.params.id)
      .populate({
        path: "booking",
        populate: [
          {
            path: "customer",
            populate: { path: "user", select: "full_name phone email" },
          },
          {
            path: "driver",
            populate: { path: "user", select: "full_name phone" },
          },
        ],
      })
      .populate({
        path: "vehicle",
        select:
          "brand model license_plate year color daily_rate current_mileage",
        populate: { path: "vehicle_type" },
      })
      .populate({
        path: "staff",
        populate: { path: "user", select: "full_name" },
      });

    if (!handover) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy biên bản bàn giao." });
    }

    res.status(200).json({
      success: true,
      data: handover,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM BIÊN BẢN THEO ĐƠN ĐẶT XE ====================
// @route GET /api/handovers/booking/:bookingId
// @access Private (Staff / Customer chủ đơn)
export const getHandoversByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Tìm booking trước để kiểm tra quyền
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });
    }

    // Kiểm tra quyền: Staff xem bất kỳ, Customer chỉ xem đơn của mình
    const staff = await Staff.findOne({ user: req.user._id });
    const customer = await Customer.findOne({ user: req.user._id });

    if (
      customer &&
      !staff &&
      booking.customer.toString() !== customer._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem biên bản của đơn này." });
    }

    const handovers = await VehicleHandover.find({ booking: bookingId })
      .populate({
        path: "vehicle",
        select: "brand model license_plate",
      })
      .populate({
        path: "staff",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ handover_time: 1 }); // Sắp xếp theo thời gian: delivery trước, return sau

    // Tách delivery và return cho dễ hiểu
    const delivery =
      handovers.find((h) => h.handover_type === "delivery") || null;
    const returnHandover =
      handovers.find((h) => h.handover_type === "return") || null;

    res.status(200).json({
      success: true,
      data: {
        booking_id: bookingId,
        booking_status: booking.status,
        delivery,
        return: returnHandover,
        // Nếu cả 2 đều có → tính km đã chạy
        km_driven:
          delivery && returnHandover
            ? returnHandover.mileage - delivery.mileage
            : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
