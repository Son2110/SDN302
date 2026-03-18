import { Booking } from "../models/booking.model.js";
import { Payment } from "../models/finance.model.js";
import { Customer, Driver, Staff } from "../models/user.model.js";
import { sendNotification } from "../utils/notificationSender.js";
import {
  createPaymentUrl as buildVnpayUrl,
  verifyPaymentCallback,
  getCreateDate,
  getExpireDate,
  getConfig,
} from "../utils/vnpay.js";

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
      title: "Đơn đã được duyệt",
      message: `Đơn đặt xe #${booking._id.toString().slice(-6)} đã được duyệt sau khi thanh toán cọc thành công.`,
      type: "booking_approved",
      relatedId: booking._id,
      relatedModel: "Booking",
    });

    // Notify all Staff
    const allStaff = await Staff.find();
    for (const staffMember of allStaff) {
      await sendNotification({
        recipientId: staffMember.user,
        title: "Đơn được xác nhận",
        message: `Khách hàng đã thanh toán cọc thành công cho đơn đặt xe #${booking._id.toString().slice(-6)}.`,
        type: "payment_success",
        relatedId: booking._id,
        relatedModel: "Booking",
      });
    }

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

    // Notify Customer
    await sendNotification({
      recipientId: customer.user,
      title: "Thanh toán hoàn tất",
      message: `Đơn hàng #${booking._id.toString().slice(-6)} đã được thanh toán đầy đủ và hoàn tất.`,
      type: "payment_success",
      relatedId: newPayment._id,
      relatedModel: "Payment",
    });

    // Notify all Staff
    const allStaff = await Staff.find();
    for (const staffMember of allStaff) {
      await sendNotification({
        recipientId: staffMember.user,
        title: "Thanh toán chốt sổ",
        message: `Đơn hàng #${booking._id.toString().slice(-6)} đã được thanh toán phần còn lại và hoàn tất.`,
        type: "payment_success",
        relatedId: booking._id,
        relatedModel: "Booking",
      });
    }

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
    let {
      payment_type,
      status,
      payment_method,
      booking_id,
      page = 1,
      limit = 20,
    } = req.query;

    // Clamp pagination
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit) || 20));

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

    let { payment_type, status, page = 1, limit = 10 } = req.query;

    // Clamp pagination
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit) || 10));

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

// ==================== VNPay Sandbox ====================

/**
 * Create a pending Payment and return VNPay paymentUrl.
 * Accepts payment_type: 'deposit' | 'rental_fee'
 * @route POST /api/payments/vnpay/create
 * @access Private (Customer)
 */
export const createVnpayPayment = async (req, res) => {
  try {
    const { booking_id, payment_type } = req.body;

    if (!["deposit", "rental_fee"].includes(payment_type)) {
      return res
        .status(400)
        .json({ message: "payment_type must be 'deposit' or 'rental_fee'" });
    }

    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(403).json({ message: "Customer only" });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const isDeposit = payment_type === "deposit";
    const amount = isDeposit
      ? booking.deposit_amount
      : booking.final_amount || 0;

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (isDeposit && booking.status !== "pending") {
      return res.status(400).json({ message: "Invalid booking status" });
    }
    if (!isDeposit && booking.status !== "vehicle_returned") {
      return res
        .status(400)
        .json({ message: "Final payment is only allowed after return" });
    }

    let payment = await Payment.findOne({
      booking: booking._id,
      payment_type,
      status: "pending",
      payment_method: "vnpay",
    });

    if (!payment) {
      payment = await Payment.create({
        booking: booking._id,
        customer: customer._id,
        payment_type,
        amount,
        payment_method: "vnpay",
        status: "pending",
        transaction_id: null,
      });
      payment.transaction_id = payment._id.toString();
      await payment.save();
    }

    const baseUrl =
      process.env.BACKEND_URL ||
      `${req.protocol || "http"}://${req.get("host") || "localhost:5000"}`;
    const returnUrl = `${baseUrl}/api/payments/vnpay/return`;

    const vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: getConfig().tmnCode,
      vnp_Amount: Math.round(amount) * 100,
      vnp_CurrCode: "VND",
      vnp_CreateDate: getCreateDate(),
      vnp_ExpireDate: getExpireDate(),
      vnp_IpAddr:
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        "127.0.0.1",
      vnp_Locale: "vn",
      vnp_OrderInfo: `Payment ${isDeposit ? "deposit" : "final"} ${booking._id
        .toString()
        .slice(-8)}`,
      vnp_OrderType: "other",
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: payment._id.toString(),
    };

    const paymentUrl = buildVnpayUrl(vnpParams);
    res.status(200).json({
      success: true,
      paymentUrl,
      payment_id: payment._id,
      txn_ref: payment._id.toString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * VNPay ReturnURL (public)
 * Verify signature -> update Payment/Booking -> redirect to frontend success page.
 * @route GET /api/payments/vnpay/return
 */
export const vnpayReturn = async (req, res) => {
  try {
    const { valid } = verifyPaymentCallback(req.query);
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const queryString = new URLSearchParams(req.query).toString();

    if (!valid) {
      return res.redirect(
        `${frontendBase}/payment/success?error=invalid_signature&${queryString}`,
      );
    }

    const txnRef = req.query.vnp_TxnRef;
    const responseCode = req.query.vnp_ResponseCode;

    const payment = txnRef ? await Payment.findById(txnRef) : null;
    if (!payment) {
      return res.redirect(
        `${frontendBase}/payment/success?error=payment_not_found&${queryString}`,
      );
    }

    if (payment.status === "pending") {
      if (responseCode === "00") {
        payment.status = "completed";
        payment.transaction_id =
          payment.transaction_id || req.query.vnp_TransactionNo || txnRef;
        await payment.save();

        const booking = await Booking.findById(payment.booking);
        if (booking) {
          if (payment.payment_type === "deposit") {
            booking.updateStatus("confirmed");
            await booking.save();
          } else if (payment.payment_type === "rental_fee") {
            booking.updateStatus("completed");
            await booking.save();
          }
        }
      } else {
        payment.status = "failed";
        await payment.save();
      }
    }

    return res.redirect(`${frontendBase}/payment/success?${queryString}`);
  } catch (error) {
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const queryString = new URLSearchParams(req.query || {}).toString();
    return res.redirect(
      `${frontendBase}/payment/success?error=server&${queryString}`,
    );
  }
};

/**
 * VNPay IPN (public)
 * @route GET /api/payments/vnpay/ipn
 */
export const vnpayIpn = async (req, res) => {
  try {
    const { valid } = verifyPaymentCallback(req.query);
    if (!valid) {
      return res.status(200).json({ RspCode: "97", Message: "Invalid Checksum" });
    }

    const txnRef = req.query.vnp_TxnRef;
    const responseCode = req.query.vnp_ResponseCode;

    const payment = txnRef ? await Payment.findById(txnRef) : null;
    if (!payment) {
      return res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }

    if (payment.status !== "pending") {
      return res
        .status(200)
        .json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (responseCode === "00") {
      payment.status = "completed";
      payment.transaction_id =
        payment.transaction_id || req.query.vnp_TransactionNo || txnRef;
      await payment.save();

      const booking = await Booking.findById(payment.booking);
      if (booking) {
        if (payment.payment_type === "deposit") {
          booking.updateStatus("confirmed");
          await booking.save();
        } else if (payment.payment_type === "rental_fee") {
          booking.updateStatus("completed");
          await booking.save();
        }
      }
    } else {
      payment.status = "failed";
      await payment.save();
    }

    return res.status(200).json({ RspCode: "00", Message: "Success" });
  } catch {
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
};

/**
 * Get payment by VNPay txnRef (Payment._id)
 * @route GET /api/payments/by-txn/:txnRef
 * @access Private (Customer)
 */
export const getPaymentByTxnRef = async (req, res) => {
  try {
    const { txnRef } = req.params;
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) return res.status(403).json({ message: "Customer only" });

    const payment = await Payment.findOne({
      $or: [{ _id: txnRef }, { transaction_id: txnRef }],
      customer: customer._id,
    }).populate("booking");

    if (!payment) return res.status(404).json({ message: "Payment not found" });
    return res.status(200).json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Verify VNPay callback again from frontend (customer auth)
 * @route POST /api/payments/vnpay/verify
 */
export const verifyVnpayPayment = async (req, res) => {
  try {
    const { txnRef, vnpayParams } = req.body;
    if (!txnRef || !vnpayParams || typeof vnpayParams !== "object") {
      return res.status(400).json({ message: "Missing txnRef or vnpayParams" });
    }

    const { valid } = verifyPaymentCallback(vnpayParams);
    if (!valid) return res.status(400).json({ message: "Invalid signature" });

    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) return res.status(403).json({ message: "Customer only" });

    const payment = await Payment.findOne({
      $or: [{ _id: txnRef }, { transaction_id: txnRef }],
      customer: customer._id,
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status === "pending") {
      if (vnpayParams.vnp_ResponseCode === "00") {
        payment.status = "completed";
        payment.transaction_id =
          payment.transaction_id || vnpayParams.vnp_TransactionNo || txnRef;
        await payment.save();

        const booking = await Booking.findById(payment.booking);
        if (booking) {
          if (payment.payment_type === "deposit") {
            booking.updateStatus("confirmed");
            await booking.save();
          } else if (payment.payment_type === "rental_fee") {
            booking.updateStatus("completed");
            await booking.save();
          }
        }
      } else {
        payment.status = "failed";
        await payment.save();
      }
    }

    const updated = await Payment.findById(payment._id).populate("booking");
    return res.status(200).json({ success: true, payment: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
