import { Booking } from "../models/booking.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Customer, Staff } from "../models/user.model.js";
import { Payment } from "../models/finance.model.js";
import { sendNotification } from "../utils/notificationSender.js";

export const getAvailableVehicles = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // If NO dates provided: Return ALL vehicles with status="available" (for Fleet page)
    if (!start_date || !end_date) {
      const allVehicles = await Vehicle.find({
        status: "available",
      }).populate("vehicle_type");

      return res.status(200).json({
        success: true,
        count: allVehicles.length,
        data: allVehicles,
      });
    }

    //1. validate dates
    const checkIn = new Date(start_date);
    const checkOut = new Date(end_date);
    const today = new Date();

    // Reset to start of day for date-only comparison
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    if (checkIn.getTime() >= checkOut.getTime())
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu phải trước ngày kết thúc" });

    // Allow today and future dates only
    if (checkIn.getTime() < today.getTime())
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu không được là ngày trong quá khứ" });

    //2. find busy car (chỉ check booking đã confirmed - đã thanh toán cọc)
    const busyBookings = await Booking.find({
      status: {
        $in: ["confirmed", "in_progress"],
      },
      $and: [{ start_date: { $lt: checkOut } }, { end_date: { $gt: checkIn } }],
    }).select("vehicle");

    const busyVehiclesIds = busyBookings.map((booking) => booking.vehicle);

    //3. find available car (status="available" AND không có trong busyVehiclesIds)
    const availableVehicles = await Vehicle.find({
      status: "available",
      _id: { $nin: busyVehiclesIds },
    }).populate("vehicle_type");

    res.status(200).json({
      success: true,
      count: availableVehicles.length,
      data: availableVehicles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const {
      vehicle_id,
      start_date,
      end_date,
      rental_type,
      pickup_location,
      return_location,
    } = req.body;

    // Check if user is admin
    if (req.user.roles && req.user.roles.includes("admin")) {
      return res.status(403).json({
        message: "Tài khoản Admin không được phép thực hiện đặt xe.",
      });
    }

    //1. infor customer
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Chỉ khách hàng mới có thể đặt xe" });

    if (rental_type === "self_drive" && !customer.driver_license) {
      return res.status(400).json({
        message:
          "Bạn chưa cập nhật Giấy phép lái xe. Vui lòng cập nhật trong Hồ sơ trước khi thuê xe tự lái!",
      });
    }

    //2. validate
    const checkIn = new Date(start_date);
    const checkOut = new Date(end_date);
    const today = new Date();

    // Reset to start of day for date-only comparison
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    if (checkIn.getTime() >= checkOut.getTime())
      return res
        .status(400)
        .json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

    // Allow today and future dates only
    if (checkIn.getTime() < today.getTime())
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu không được là ngày trong quá khứ" });

    //3. double check (race condition - chỉ check booking đã confirmed - chỉ check booking đã confirmed)
    const overlappingBooking = await Booking.findOne({
      vehicle: vehicle_id,
      status: {
        $in: ["confirmed", "in_progress"],
      },
      $and: [{ start_date: { $lt: checkOut } }, { end_date: { $gt: checkIn } }],
    });

    if (overlappingBooking)
      return res.status(400).json({
        message: "Xe đã được khách khác đặt trong khoảng thời gian này",
      });

    //4. check status vehicle
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle || vehicle.status !== "available")
      return res
        .status(404)
        .json({ message: "Xe không tồn tại hoặc hiện không khả dụng" });

    //5. count money (billable days: 13-16 = 3 days, exclude last day for handover)
    const diffTime = Math.abs(checkOut - checkIn);
    const rentalDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const actualDays = rentalDay > 0 ? rentalDay : 1;

    let total_amount = actualDays * vehicle.daily_rate;

    if (rental_type === "with_driver") {
      const DRIVER_FEE_PER_DAY = 500000;
      total_amount += actualDays * DRIVER_FEE_PER_DAY;
    }

    //deposit
    const deposit_amount = total_amount * 0.3;

    //time checkIn (if > 3h => cancel)
    const max_checkin_time = new Date(checkIn.getTime() + 3 * 60 * 60 * 1000);

    //create booking
    const newBooking = await Booking.create({
      customer: customer._id,
      vehicle: vehicle._id,
      rental_type,
      start_date: checkIn,
      end_date: checkOut,
      max_checkin_time,
      pickup_location,
      return_location,
      total_amount,
      deposit_amount,
      status: "pending",
    });

    // Notify Customer
    await sendNotification({
      recipientId: customer.user,
      title: "Đặt xe thành công",
      message: `Đơn đặt xe #${newBooking._id.toString().slice(-6)} đã được tạo. Vui lòng thanh toán cọc để xác nhận.`,
      type: "booking_created",
      relatedId: newBooking._id,
      relatedModel: "Booking",
    });

    res.status(201).json({
      success: true,
      message:
        "Đặt xe thành công. Vui lòng thanh toán tiền cọc để xác nhận đơn.",
      data: {
        booking_id: newBooking._id,
        total_amount: newBooking.total_amount,
        deposit_amount: newBooking.deposit_amount,
        status: newBooking.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== HUỶ ĐƠN ====================
// @route PUT /api/bookings/:id/cancel
// @access Private (Customer hoặc Staff)
export const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // Chỉ huỷ khi đơn đang pending hoặc confirmed
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        message: `Đơn đang ở trạng thái "${booking.status}", không thể huỷ.`,
      });
    }

    // Kiểm tra quyền: customer chỉ huỷ đơn của mình, staff huỷ bất kỳ
    const customer = await Customer.findOne({ user: req.user._id });
    const staff = await Staff.findOne({ user: req.user._id });

    if (customer) {
      if (booking.customer.toString() !== customer._id.toString()) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền huỷ đơn này." });
      }
    } else if (!staff) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thực hiện thao tác này." });
    }

    const previousStatus = booking.status;

    // Nếu đơn đã confirmed (đã cọc) → tạo record hoàn tiền
    if (previousStatus === "confirmed") {
      await Payment.create({
        booking: booking._id,
        customer: booking.customer,
        payment_type: "refund",
        amount: booking.deposit_amount,
        payment_method: "cash",
        status: "completed",
        transaction_id: `REFUND_${Date.now()}`,
        processed_by: staff ? staff._id : null,
      });
    }

    booking.updateStatus("cancelled");
    await booking.save();

    res.status(200).json({
      success: true,
      message:
        previousStatus === "confirmed"
          ? "Đã huỷ đơn thành công. Tiền cọc sẽ được hoàn lại."
          : "Đã huỷ đơn thành công.",
      data: {
        booking_id: booking._id,
        booking_status: booking.status,
        refunded: previousStatus === "confirmed",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM ĐƠN CỦA TÔI (Customer) ====================
// @route GET /api/bookings/my-bookings
// @access Private (Customer)
export const getMyBookings = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Chỉ khách hàng mới xem được đơn của mình." });

    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customer: customer._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("vehicle")
      .populate("driver")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM CHI TIẾT ĐƠN ====================
// @route GET /api/bookings/:id
// @access Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "vehicle",
        populate: { path: "vehicle_type" },
      })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name email phone" },
      })
      .populate({
        path: "driver",
        populate: { path: "user", select: "full_name email phone" },
      });

    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // Customer chỉ xem đơn của mình
    const customer = await Customer.findOne({ user: req.user._id });
    const staff = await Staff.findOne({ user: req.user._id });

    if (
      customer &&
      booking.customer._id.toString() !== customer._id.toString() &&
      !staff
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem đơn này." });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF CẬP NHẬT ĐƠN ====================
// @route PUT /api/bookings/:id
// @access Private (Staff)
export const updateBooking = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        message: "Chỉ nhân viên mới có quyền thực hiện thao tác này.",
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // Chỉ cho sửa khi đơn pending hoặc confirmed
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        message: `Đơn đang ở trạng thái "${booking.status}", không thể chỉnh sửa.`,
      });
    }

    const {
      vehicle_id,
      start_date,
      end_date,
      pickup_location,
      return_location,
      rental_type,
    } = req.body;

    // Cập nhật ngày nếu có
    const checkIn = start_date ? new Date(start_date) : booking.start_date;
    const checkOut = end_date ? new Date(end_date) : booking.end_date;

    if (checkIn >= checkOut) {
      return res
        .status(400)
        .json({ message: "Ngày kết thúc phải sau ngày bắt đầu." });
    }

    // Đổi xe nếu có
    let vehicle;
    if (vehicle_id && vehicle_id !== booking.vehicle.toString()) {
      // Check xe mới có available không
      vehicle = await Vehicle.findById(vehicle_id);
      if (!vehicle || vehicle.status !== "available") {
        return res
          .status(400)
          .json({ message: "Xe mới không tồn tại hoặc không khả dụng." });
      }

      // Check trùng lịch xe mới
      const overlapping = await Booking.findOne({
        _id: { $ne: booking._id },
        vehicle: vehicle_id,
        status: {
          $nin: ["cancelled", "completed", "deposit_lost", "vehicle_returned"],
        },
        $and: [
          { start_date: { $lt: checkOut } },
          { end_date: { $gt: checkIn } },
        ],
      });

      if (overlapping) {
        return res.status(400).json({
          message: "Xe mới đã có khách đặt trong khoảng thời gian này.",
        });
      }

      booking.vehicle = vehicle._id;
    } else {
      vehicle = await Vehicle.findById(booking.vehicle);

      // Check trùng lịch nếu đổi ngày
      if (start_date || end_date) {
        const overlapping = await Booking.findOne({
          _id: { $ne: booking._id },
          vehicle: booking.vehicle,
          status: {
            $nin: [
              "cancelled",
              "completed",
              "deposit_lost",
              "vehicle_returned",
            ],
          },
          $and: [
            { start_date: { $lt: checkOut } },
            { end_date: { $gt: checkIn } },
          ],
        });

        if (overlapping) {
          return res.status(400).json({
            message: "Xe đã có lịch đặt trùng trong khoảng thời gian mới.",
          });
        }
      }
    }

    // Cập nhật fields
    if (start_date) booking.start_date = checkIn;
    if (end_date) booking.end_date = checkOut;
    if (pickup_location) booking.pickup_location = pickup_location;
    if (return_location) booking.return_location = return_location;
    if (rental_type) booking.rental_type = rental_type;

    // Tính lại tiền
    const diffTime = Math.abs(booking.end_date - booking.start_date);
    const rentalDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const actualDays = rentalDay > 0 ? rentalDay : 1;

    let total_amount = actualDays * vehicle.daily_rate;
    if (booking.rental_type === "with_driver") {
      const DRIVER_FEE_PER_DAY = 500000;
      total_amount += actualDays * DRIVER_FEE_PER_DAY;
    }

    booking.total_amount = total_amount;
    booking.deposit_amount = total_amount * 0.3;
    booking.max_checkin_time = new Date(
      booking.start_date.getTime() + 3 * 60 * 60 * 1000,
    );
    booking.managed_by = staff._id;

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Đã cập nhật đơn đặt xe thành công.",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF XOÁ ĐƠN ====================
// @route DELETE /api/bookings/:id
// @access Private (Staff)
export const deleteBooking = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        message: "Chỉ nhân viên mới có quyền thực hiện thao tác này.",
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // Chỉ cho xoá khi đơn đã cancelled hoặc đang pending
    if (!["pending", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        message: `Đơn đang ở trạng thái "${booking.status}", không thể xoá. Chỉ xoá được đơn pending hoặc cancelled.`,
      });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Đã xoá đơn đặt xe thành công.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF XEM TẤT CẢ ĐƠN ====================
// @route GET /api/bookings/all
// @access Private (Staff)
export const getAllBookings = async (req, res) => {
  try {
    const { status, rental_type, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (rental_type) filter.rental_type = rental_type;

    const bookings = await Booking.find(filter)
      .populate("vehicle")
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name email phone" },
      })
      .populate("driver")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== LẤY CÁC NGÀY ĐÃ ĐƯỢC BOOK CỦA XE ====================
// @route GET /api/bookings/vehicle/:vehicleId/booked-dates
// @access Public
export const getVehicleBookedDates = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // ONLY return confirmed/in_progress bookings (đã thanh toán cọc)
    // Pending bookings chưa thanh toán nên không block calendar
    const bookings = await Booking.find({
      vehicle: vehicleId,
      status: {
        $in: ["confirmed", "in_progress"],
      },
    }).select("start_date end_date status");

    // Return array of date ranges
    const bookedRanges = bookings.map((booking) => ({
      start: booking.start_date,
      end: booking.end_date,
    }));

    res.status(200).json({
      success: true,
      count: bookedRanges.length,
      data: bookedRanges,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
