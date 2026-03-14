import { Booking, ExtensionRequest } from "../models/booking.model.js";
import { Customer, Staff } from "../models/user.model.js";

// @route POST /api/extensions/request
// @access Private (Chỉ Customer)
export const requestExtension = async (req, res) => {
  try {
    const { booking_id, new_end_date } = req.body;

    // 1. Xác thực khách hàng
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Chỉ khách hàng mới có thể yêu cầu gia hạn." });

    // 2. Tìm đơn hàng
    const booking = await Booking.findById(booking_id).populate("vehicle");
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // Đảm bảo đơn này là của ông khách đang login
    if (booking.customer.toString() !== customer._id.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thao tác trên đơn này." });
    }

    // Chỉ cho phép gia hạn khi xe đang được thuê hoặc chuẩn bị lấy
    if (!["confirmed", "in_progress"].includes(booking.status)) {
      return res.status(400).json({
        message: `Đơn hàng đang ở trạng thái ${booking.status}, không thể gia hạn.`,
      });
    }

    // 3. Validate thời gian mới
    const currentEndDate = new Date(booking.end_date);
    const requestedEndDate = new Date(new_end_date);

    if (requestedEndDate <= currentEndDate) {
      return res
        .status(400)
        .json({ message: "Ngày gia hạn phải lớn hơn ngày trả xe hiện tại." });
    }

    // Tính số ngày gia hạn thêm (Làm tròn lên)
    const diffTime = Math.abs(requestedEndDate - currentEndDate);
    const daysExtended = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 4. Tính toán tiền phát sinh (additional_amount) với phí tăng thêm 20%
    let dailyRate = booking.vehicle.daily_rate;
    let surchargeRate = dailyRate * 1.2; // Tăng 20% cho việc gia hạn
    let additionalAmount = daysExtended * surchargeRate;

    if (booking.rental_type === "with_driver") {
      const DRIVER_FEE_PER_DAY = 500000; // Có thể lấy từ Config DB
      additionalAmount += daysExtended * DRIVER_FEE_PER_DAY;
    }

    // 5. KIỂM TRA ĐỤNG LỊCH (CRITICAL STEP)
    // Có ai đó đã đặt chiếc xe này từ ngày trả hiện tại đến ngày gia hạn mới không?
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id }, // Loại trừ chính cái đơn hiện tại ra
      vehicle: booking.vehicle._id,
      status: {
        $nin: ["cancelled", "completed", "deposit_lost", "vehicle_returned"],
      },
      $and: [
        { start_date: { $lt: requestedEndDate } }, // Ngày người khác lấy xe < Ngày khách muốn trả (mới)
        { end_date: { $gt: currentEndDate } }, // Ngày người khác trả xe > Ngày khách định trả (cũ)
      ],
    });

    const hasConflict = !!conflictingBooking;

    // NẾU CÓ XUNG ĐỘT, TỰ ĐỘNG TỪ CHỐI NGAY LẬP TỨC
    if (hasConflict) {
      const extensionRequest = await ExtensionRequest.create({
        booking: booking._id,
        customer: customer._id,
        original_end_date: currentEndDate,
        new_end_date: requestedEndDate,
        days_extended: daysExtended,
        has_conflict: true,
        additional_amount: additionalAmount,
        status: "rejected", // Tự động từ chối khi có xung đột
        reject_reason: "Xe đã có người đặt trong khoảng thời gian gia hạn.",
      });

      return res.status(200).json({
        success: false,
        message: "Yêu cầu gia hạn bị từ chối do xe đã có người đặt trong khoảng thời gian này.",
        data: extensionRequest,
      });
    }

    // 6. TẠO RECORD YÊU CẦU GIA HẠN (Không có xung đột, gửi cho Staff duyệt)
    const extensionRequest = await ExtensionRequest.create({
      booking: booking._id,
      customer: customer._id,
      original_end_date: currentEndDate,
      new_end_date: requestedEndDate,
      days_extended: daysExtended,
      has_conflict: false,
      additional_amount: additionalAmount,
      status: "pending", // Chờ Staff duyệt
    });

    res.status(201).json({
      success: true,
      message: "Đã gửi yêu cầu gia hạn. Vui lòng chờ nhân viên xác nhận.",
      data: extensionRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/extensions/:id/approve
// @access Private (Chỉ Staff/Admin)
export const approveExtension = async (req, res) => {
  try {
    const extensionId = req.params.id;

    // 1. Xác thực Staff đang xử lý
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res
        .status(403)
        .json({ message: "Chỉ nhân viên mới có quyền duyệt gia hạn." });
    }

    // 2. Tìm yêu cầu gia hạn
    const extensionRequest = await ExtensionRequest.findById(extensionId);
    if (!extensionRequest) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu gia hạn này." });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        message: `Yêu cầu này đã được xử lý (Trạng thái: ${extensionRequest.status}).`,
      });
    }

    // 3. Tìm Booking gốc
    const booking = await Booking.findById(extensionRequest.booking);
    if (!booking) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy đơn đặt xe gốc." });
    }

    // 3.5. Kiểm tra đơn còn hợp lệ để gia hạn không
    if (!["confirmed", "in_progress"].includes(booking.status)) {
      return res.status(400).json({
        message: `Đơn đang ở trạng thái "${booking.status}", không thể duyệt gia hạn.`,
      });
    }

    // 4. CẬP NHẬT BOOKING GỐC (HỢP ĐỒNG)
    // Kéo dài thời gian trả xe
    booking.end_date = extensionRequest.new_end_date;
    // Cộng thêm tiền thuê phát sinh vào tổng tiền (Khách sẽ trả lúc kết thúc chuyến đi)
    booking.total_amount += extensionRequest.additional_amount;

    await booking.save();

    // 5. CẬP NHẬT TRẠNG THÁI YÊU CẦU GIA HẠN
    extensionRequest.status = "approved";
    extensionRequest.processed_by = staff._id; // Lưu lại vết nhân viên duyệt
    // Note: Trường updatedAt sẽ tự động được Mongoose đổi thành 'processed_at' nhờ cấu hình schema của bạn
    await extensionRequest.save();

    res.status(200).json({
      success: true,
      message: "Đã duyệt gia hạn thành công! Hợp đồng đã được cập nhật.",
      data: {
        extension_status: extensionRequest.status,
        new_end_date: booking.end_date,
        new_total_amount: booking.total_amount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/extensions/:id/reject
// @access Private (Chỉ Staff)
export const rejectExtension = async (req, res) => {
  try {
    const extensionId = req.params.id;
    const { reject_reason } = req.body;

    // 1. Xác thực Staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res
        .status(403)
        .json({ message: "Chỉ nhân viên mới có quyền từ chối gia hạn." });
    }

    // 2. Tìm yêu cầu gia hạn
    const extensionRequest = await ExtensionRequest.findById(extensionId);
    if (!extensionRequest) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu gia hạn này." });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        message: `Yêu cầu này đã được xử lý (Trạng thái: ${extensionRequest.status}).`,
      });
    }

    // 3. Cập nhật trạng thái
    extensionRequest.status = "rejected";
    extensionRequest.processed_by = staff._id;
    await extensionRequest.save();

    res.status(200).json({
      success: true,
      message: "Đã từ chối yêu cầu gia hạn.",
      data: {
        extension_status: extensionRequest.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF: XEM TẤT CẢ YÊU CẦU GIA HẠN ====================
// @route GET /api/extensions
// @access Private (Staff)
export const getAllExtensions = async (req, res) => {
  try {
    const { status, booking_id, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
      if (
        !["pending", "approved", "rejected", "alternative_offered"].includes(
          status,
        )
      ) {
        return res.status(400).json({
          message:
            "status không hợp lệ. Chấp nhận: pending, approved, rejected, alternative_offered.",
        });
      }
      filter.status = status;
    }
    if (booking_id) filter.booking = booking_id;

    const extensions = await ExtensionRequest.find(filter)
      .populate({
        path: "booking",
        select: "status rental_type start_date end_date total_amount vehicle",
        populate: {
          path: "vehicle",
          select: "brand model license_plate",
        },
      })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name phone email" },
      })
      .populate({
        path: "processed_by",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ requested_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ExtensionRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: extensions.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: extensions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM CHI TIẾT 1 YÊU CẦU GIA HẠN ====================
// @route GET /api/extensions/:id
// @access Private (Staff / Customer chủ yêu cầu)
export const getExtensionById = async (req, res) => {
  try {
    const extension = await ExtensionRequest.findById(req.params.id)
      .populate({
        path: "booking",
        populate: [
          {
            path: "vehicle",
            select: "brand model license_plate daily_rate",
            populate: { path: "vehicle_type" },
          },
          {
            path: "customer",
            populate: { path: "user", select: "full_name phone email" },
          },
        ],
      })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name phone email" },
      })
      .populate({
        path: "processed_by",
        populate: { path: "user", select: "full_name" },
      })
      .populate({
        path: "alternative_vehicle",
        select: "brand model license_plate daily_rate",
      });

    if (!extension) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu gia hạn." });
    }

    // Customer chỉ xem yêu cầu của mình
    const customer = await Customer.findOne({ user: req.user._id });
    const staff = await Staff.findOne({ user: req.user._id });

    if (
      customer &&
      !staff &&
      extension.customer._id.toString() !== customer._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem yêu cầu gia hạn này." });
    }

    res.status(200).json({
      success: true,
      data: extension,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== CUSTOMER: XEM YÊU CẦU GIA HẠN CỦA MÌNH ====================
// @route GET /api/extensions/my-requests
// @access Private (Customer)
export const getMyExtensions = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res
        .status(403)
        .json({ message: "Chỉ khách hàng mới xem được yêu cầu gia hạn." });
    }

    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customer: customer._id };
    if (status) filter.status = status;

    const extensions = await ExtensionRequest.find(filter)
      .populate({
        path: "booking",
        select: "status rental_type start_date end_date total_amount",
        populate: {
          path: "vehicle",
          select: "brand model license_plate",
        },
      })
      .populate({
        path: "processed_by",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ requested_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ExtensionRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: extensions.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: extensions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
