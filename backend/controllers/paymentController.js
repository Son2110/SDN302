import { Booking } from "../models/booking.model.js";
import { Payment } from "../models/finance.model.js";
import { Customer, Driver, Staff } from "../models/user.model.js";
import { sendNotification } from "../utils/notificationSender.js";

export const processDepositPayment = async (req, res) => {
  try {
    const { booking_id, payment_method, transaction_id } = req.body;

    //1. validate payment
    const validMethods = [
      "cash",
      "card",
      "momo",
      "zalopay",
      "vnpay",
      "bank_transfer",
    ];
    if (!validMethods.includes(payment_method))
      return res
        .status(400)
        .json({ message: "Phương thức thanh toán không hợp lệ" });

    //2. check auth
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Chỉ khách hàng mới có thể thanh toán" });

    //3. find booking
    const booking = await Booking.findById(booking_id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe" });

    //4. check customer
    if (booking.customer.toString() !== customer._id.toString())
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thanh toán cho đơn này" });

    //5. check status booking
    if (booking.status !== "pending")
      return res.status(400).json({
        message: `Đơn đang ở trạng thái "${booking.status}", không thể thanh toán`,
      });

    //6. Save payment
    const newPayment = await Payment.create({
      booking: booking._id,
      customer: customer._id,
      payment_type: "deposit",
      amount: booking.deposit_amount,
      payment_method: payment_method,
      status: "completed",
      transaction_id: transaction_id,
      processed_by: null,
    });

    //7. Update booking status
    booking.updateStatus("confirmed");
    await booking.save();

    // Notify Customer
    await sendNotification({
      recipientId: customer.user,
      title: "Thanh toán cọc thành công",
      message: `Đơn đặt xe #${booking._id.toString().slice(-6)} đã được xác nhận.`,
      type: "payment_success",
      relatedId: booking._id,
      relatedModel: "Booking",
    });

    //8 response
    res.status(200).json({
      success: true,
      message: "Thanh toán cọc thành công. Đơn đặt xe đã được xác nhận",
      data: {
        payment_id: newPayment._id,
        amount_paid: newPayment.amount,
        payment_date: newPayment.payment_date,
        booking_status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/payments/final
// @access Private (Chỉ Customer)
export const processFinalPayment = async (req, res) => {
  try {
    const { booking_id, payment_method, transaction_id } = req.body;

    // 0. Validate phương thức thanh toán
    const validMethods = [
      "cash",
      "card",
      "momo",
      "zalopay",
      "vnpay",
      "bank_transfer",
    ];
    if (!validMethods.includes(payment_method))
      return res
        .status(400)
        .json({ message: "Phương thức thanh toán không hợp lệ." });

    // 1. Xác thực Customer
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Chỉ khách hàng mới có quyền thanh toán." });

    // 2. Tìm đơn hàng
    const booking = await Booking.findById(booking_id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    if (booking.customer.toString() !== customer._id.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thanh toán cho đơn này." });
    }

    // 3. Kiểm tra trạng thái: Chỉ thanh toán khi đã trả xe
    if (booking.status !== "vehicle_returned") {
      return res.status(400).json({
        message: `Đơn hàng đang ở trạng thái ${booking.status}. Không thể thanh toán chốt sổ lúc này.`,
      });
    }

    // 4. Kiểm tra đã thanh toán chốt sổ chưa (tránh trùng)
    const existingFinalPayment = await Payment.findOne({
      booking: booking._id,
      payment_type: "rental_fee",
      status: "completed",
    });
    if (existingFinalPayment) {
      return res.status(400).json({
        message: "Đơn này đã được thanh toán chốt sổ rồi.",
      });
    }

    // 5. Kiểm tra số tiền cần thanh toán
    if (booking.final_amount <= 0) {
      // Nếu không còn nợ đồng nào (hoặc được thối lại tiền), tự động đóng đơn luôn
      booking.updateStatus("completed");
      await booking.save();
      return res.status(200).json({
        success: true,
        message:
          "Đơn hàng không phát sinh chi phí thêm. Đã tự động đóng hợp đồng!",
        data: { booking_status: booking.status },
      });
    }

    // 5. TẠO HÓA ĐƠN THANH TOÁN PHẦN CÒN LẠI (RENTAL FEE / PENALTY)
    const newPayment = await Payment.create({
      booking: booking._id,
      customer: customer._id,
      payment_type: "rental_fee", // Thu tiền thuê (và các khoản cộng dồn)
      amount: booking.final_amount,
      payment_method: payment_method,
      status: "completed",
      transaction_id: transaction_id || `FINAL_TXN_${Date.now()}`,
    });

    // 6. ĐÓNG HỢP ĐỒNG (COMPLETED)
    booking.updateStatus("completed");
    await booking.save();

    await sendNotification({
      recipientId: customer.user,
      title: "Thanh toán hoàn tất",
      message: `Đơn hàng #${booking._id.toString().slice(-6)} đã được thanh toán đầy đủ và hoàn tất.`,
      type: "payment_success",
      relatedId: newPayment._id,
      relatedModel: "Payment",
    });

    // 7. Cộng điểm Loyalty cho khách hàng
    customer.loyalty_points += Math.floor(booking.total_amount / 100000);
    customer.total_bookings += 1;
    customer.total_spent += booking.total_amount;
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Thanh toán hoàn tất. Cảm ơn quý khách đã sử dụng dịch vụ!",
      data: {
        payment_id: newPayment._id,
        amount_paid: newPayment.amount,
        booking_status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF: XEM TẤT CẢ GIAO DỊCH ====================
// @route GET /api/payments
// @access Private (Staff)
export const getAllPayments = async (req, res) => {
  try {
    const {
      payment_type,
      status,
      payment_method,
      booking_id,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (payment_type) {
      if (
        ![
          "deposit",
          "rental_fee",
          "extension_fee",
          "penalty",
          "refund",
        ].includes(payment_type)
      ) {
        return res.status(400).json({
          message:
            "payment_type không hợp lệ. Chấp nhận: deposit, rental_fee, extension_fee, penalty, refund.",
        });
      }
      filter.payment_type = payment_type;
    }
    if (status) filter.status = status;
    if (payment_method) filter.payment_method = payment_method;
    if (booking_id) filter.booking = booking_id;

    const payments = await Payment.find(filter)
      .populate({
        path: "booking",
        select:
          "status rental_type start_date end_date total_amount deposit_amount final_amount",
      })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name phone email" },
      })
      .populate({
        path: "processed_by",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ payment_date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM CHI TIẾT 1 GIAO DỊCH ====================
// @route GET /api/payments/:id
// @access Private (Staff)
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: "booking",
        select:
          "status rental_type start_date end_date total_amount deposit_amount final_amount vehicle",
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
      });

    if (!payment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy giao dịch thanh toán." });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== CUSTOMER: XEM LỊCH SỪ THANH TOÁN CỦA MÌNH ====================
// @route GET /api/payments/my-payments
// @access Private (Customer)
export const getMyPayments = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res
        .status(403)
        .json({ message: "Chỉ khách hàng mới xem được lịch sử thanh toán." });
    }

    const { payment_type, status, page = 1, limit = 10 } = req.query;

    const filter = { customer: customer._id };
    if (payment_type) filter.payment_type = payment_type;
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate({
        path: "booking",
        select: "status rental_type start_date end_date total_amount",
        populate: {
          path: "vehicle",
          select: "brand model license_plate",
        },
      })
      .sort({ payment_date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM GIAO DỊCH THEO ĐƠN ĐẶT XE ====================
// @route GET /api/payments/booking/:bookingId
// @access Private (Staff / Customer chủ đơn)
export const getPaymentsByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Tìm booking để kiểm tra quyền
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
        .json({ message: "Bạn không có quyền xem giao dịch của đơn này." });
    }

    const payments = await Payment.find({ booking: bookingId })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name phone" },
      })
      .populate({
        path: "processed_by",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ payment_date: 1 });

    // Tóm tắt tài chính của đơn
    const totalPaid = payments
      .filter((p) => p.status === "completed" && p.payment_type !== "refund")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = payments
      .filter((p) => p.payment_type === "refund" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      count: payments.length,
      summary: {
        total_amount: booking.total_amount,
        deposit_amount: booking.deposit_amount,
        final_amount: booking.final_amount,
        total_paid: totalPaid,
        total_refunded: totalRefunded,
        remaining:
          (booking.final_amount || 0) > 0
            ? booking.final_amount - (totalPaid - booking.deposit_amount)
            : 0,
      },
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
