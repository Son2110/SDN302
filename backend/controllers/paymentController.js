import { Payment } from "../models/finance.model.js";
import { Booking } from "../models/booking.model.js";
import { Customer } from "../models/user.model.js";
import { Staff } from "../models/user.model.js";
import { createPaymentUrl, verifyPaymentCallback, parsePaymentResponse } from "../utils/vnpay.js";

/**
 * Create payment
 * POST /api/payments
 */
export const createPayment = async (req, res) => {
  try {
    const { booking, payment_type, amount, payment_method, promotion_code } = req.body;

    // Get customer
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    // Get booking
    const bookingDoc = await Booking.findById(booking);
    if (!bookingDoc) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check permission
    if (bookingDoc.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate payment type and amount (B2C - Full Payment)
    let maxAmount = 0;
    if (payment_type === "rental_fee") {
      // B2C: Full payment = 100% total_amount
      // Check if rental_fee has been paid
      const paidRentalFees = await Payment.aggregate([
        {
          $match: {
            booking: bookingDoc._id,
            payment_type: "rental_fee",
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);
      const paidRentalFeeAmount = paidRentalFees[0]?.total || 0;
      maxAmount = bookingDoc.total_amount - paidRentalFeeAmount;
      
      // For B2C, rental_fee should be full payment (100%)
      if (amount !== bookingDoc.total_amount && paidRentalFeeAmount === 0) {
        return res.status(400).json({
          success: false,
          message: `B2C model requires full payment. Expected: ${bookingDoc.total_amount}, Got: ${amount}`,
        });
      }
    } else if (payment_type === "extension_fee" || payment_type === "penalty") {
      // Extension fee and penalty are calculated by system
      // Accept the amount provided (will be validated by business logic)
      maxAmount = amount; // Allow the amount provided
    } else if (payment_type === "deposit") {
      // Deposit is no longer used in B2C model
      return res.status(400).json({
        success: false,
        message: "Deposit payment is not supported. Please use rental_fee for full payment.",
      });
    }

    // Validate amount doesn't exceed maximum
    if (payment_type !== "extension_fee" && payment_type !== "penalty" && amount > maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds maximum. Maximum: ${maxAmount}, Got: ${amount}`,
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Create payment
    const payment = await Payment.create({
      booking: bookingDoc._id,
      customer: customer._id,
      payment_type,
      amount,
      payment_method,
      status: "pending",
    });

    // If online payment, create payment URL
    if (["vnpay", "momo", "zalopay"].includes(payment_method)) {
      const orderId = payment._id.toString();
      const bookingIdStr = bookingDoc._id.toString();
      const orderInfo = `Thanh toan ${payment_type} cho booking ${bookingIdStr.slice(-8)}`;
      
      // Get client IP from request (nếu có)
      // VNPay yêu cầu IPv4, không dùng IPv6 (::1)
      let clientIp = req.ip || req.connection?.remoteAddress || "127.0.0.1";
      if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1") {
        clientIp = "127.0.0.1"; // Convert IPv6 localhost to IPv4
      }
      
      const paymentUrl = createPaymentUrl({
        amount,
        orderId,
        orderInfo,
        returnUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payments/success?payment=${payment._id}`,
        ipnUrl: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/webhook/vnpay`,
        ipAddr: clientIp,
      });

      // Update payment with transaction_id (orderId)
      payment.transaction_id = orderId;
      await payment.save();

      return res.json({
        success: true,
        payment,
        payment_url: paymentUrl,
      });
    }

    // Cash payment - staff will process later
    res.status(201).json({
      success: true,
      payment,
      message: "Payment created. Staff will process cash payment.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment",
    });
  }
};

/**
 * Get payment by ID
 * GET /api/payments/:id
 */
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("booking")
      .populate("customer")
      .populate("processed_by");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check permission
    const customer = await Customer.findOne({ user: req.user._id });
    if (customer && payment.customer._id.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payment",
    });
  }
};

/**
 * Get payments with filters
 * GET /api/payments
 */
export const getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      booking,
      customer,
      status,
      payment_type,
    } = req.query;

    const filter = {};

    // Customer can only see their own payments
    const customerDoc = await Customer.findOne({ user: req.user._id });
    if (customerDoc) {
      filter.customer = customerDoc._id;
    } else {
      // Staff can see all payments
      const staff = await Staff.findOne({ user: req.user._id });
      if (!staff) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
      if (customer) {
        filter.customer = customer;
      }
    }

    if (booking) filter.booking = booking;
    if (status) filter.status = status;
    if (payment_type) filter.payment_type = payment_type;

    const skip = (Number(page) - 1) * Number(limit);
    const payments = await Payment.find(filter)
      .populate("booking")
      .populate("customer")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payments",
    });
  }
};

/**
 * Get payments for a booking
 * GET /api/payments/booking/:bookingId
 */
export const getBookingPayments = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check permission
    const customer = await Customer.findOne({ user: req.user._id });
    if (customer && booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const payments = await Payment.find({ booking: booking._id })
      .populate("customer")
      .populate("processed_by")
      .sort({ createdAt: -1 });

    // Calculate totals
    const totalPaid = payments
      .filter((p) => p.status === "completed" && p.payment_type !== "refund")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = payments
      .filter((p) => p.payment_type === "refund" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      payments,
      summary: {
        totalPaid,
        totalRefunded,
        netAmount: totalPaid - totalRefunded,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get booking payments",
    });
  }
};

/**
 * Process cash payment (staff only)
 * POST /api/payments/:id/process
 */
export const processPayment = async (req, res) => {
  try {
    const { transaction_id } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check if user is staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Only staff can process cash payments",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot process payment with status: ${payment.status}`,
      });
    }

    if (payment.payment_method !== "cash") {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for cash payments",
      });
    }

    payment.status = "completed";
    payment.transaction_id = transaction_id || `CASH-${Date.now()}`;
    payment.processed_by = staff._id;
    await payment.save();

    // Update booking status if deposit paid
    await updateBookingAfterPayment(payment);

    res.json({
      success: true,
      payment,
      message: "Payment processed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process payment",
    });
  }
};

/**
 * Verify payment from VNPay callback params (called by frontend)
 * POST /api/payments/:id/verify
 */
export const verifyPayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const vnpayParams = req.body; // VNPay callback params from frontend

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.error("❌ [VerifyPayment] Payment not found:", paymentId);
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // If VNPay params provided, process them
    if (vnpayParams && vnpayParams.vnp_TxnRef) {
      // Create a copy of params for verification (verifyPaymentCallback modifies the object)
      const paramsForVerification = { ...vnpayParams };
      
      // Verify signature
      const isValid = verifyPaymentCallback(paramsForVerification);

      if (!isValid) {
        console.error("❌ [VerifyPayment] Invalid signature");
        return res.status(400).json({
          success: false,
          message: "Invalid signature",
        });
      }

      // Parse response
      const response = parsePaymentResponse(vnpayParams);

      // Update payment status if needed
      if (response.success && payment.status === "pending") {
        payment.status = "completed";
        payment.transaction_id = response.transactionId?.toString() || vnpayParams.vnp_TransactionNo;
        await payment.save();

        // Update booking status (B2C - Full Payment)
        await updateBookingAfterPayment(payment);
      } else if (!response.success && payment.status === "pending") {
        payment.status = "failed";
        await payment.save();
        console.error(`❌ [VerifyPayment] Payment ${payment._id} failed. Response code: ${response.responseCode}`);
      }
    }

    // Reload payment to get latest status
    const updatedPayment = await Payment.findById(paymentId)
      .populate("booking")
      .populate("customer");

    res.json({
      success: true,
      payment: updatedPayment,
      status: updatedPayment.status,
    });
  } catch (error) {
    console.error("❌ [VerifyPayment] Error:", error);
    console.error("❌ [VerifyPayment] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

/**
 * Cancel payment
 * POST /api/payments/:id/cancel
 */
export const cancelPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only cancel pending payments",
      });
    }

    // For online payments, might need to cancel with gateway
    // For now, just update status
    payment.status = "failed";
    await payment.save();

    res.json({
      success: true,
      payment,
      message: "Payment cancelled",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel payment",
    });
  }
};

/**
 * Create payment URL for online payment
 * POST /api/payments/:id/create-payment-url
 */
export const createPaymentUrlForPayment = async (req, res) => {
  try {
    const { return_url } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      console.error("❌ [CreatePaymentUrl] Payment not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only create payment URL for pending payments",
      });
    }

    if (!["vnpay", "momo", "zalopay"].includes(payment.payment_method)) {
      return res.status(400).json({
        success: false,
        message: "This payment method does not support online payment",
      });
    }

    const booking = await Booking.findById(payment.booking);
    if (!booking) {
      console.error("❌ [CreatePaymentUrl] Booking not found:", payment.booking);
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const orderId = payment._id.toString();
    const bookingIdStr = booking._id.toString();
    const orderInfo = `Thanh toan ${payment.payment_type} cho booking ${bookingIdStr.slice(-8)}`;

    // Get client IP from request (nếu có)
    // VNPay yêu cầu IPv4, không dùng IPv6 (::1)
    let clientIp = req.ip || req.connection?.remoteAddress || "127.0.0.1";
    if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1" || clientIp?.startsWith("::")) {
      clientIp = "127.0.0.1"; // Convert IPv6 localhost to IPv4
    }

    const paymentUrl = createPaymentUrl({
      amount: payment.amount,
      orderId,
      orderInfo,
      returnUrl: return_url || `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/vnpay-return`,
      ipnUrl: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payments/webhook/vnpay`,
      ipAddr: clientIp,
    });

    payment.transaction_id = orderId;
    await payment.save();

    res.json({
      success: true,
      payment_url: paymentUrl,
    });
  } catch (error) {
    console.error("❌ [CreatePaymentUrl] Error:", error);
    console.error("❌ [CreatePaymentUrl] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment URL",
    });
  }
};

/**
 * VNPay Webhook Handler
 * POST /api/payments/webhook/vnpay
 */
export const vnpayWebhook = async (req, res) => {
  try {
    const params = req.query;

    // Verify signature
    const isValid = verifyPaymentCallback(params);
    if (!isValid) {
      return res.status(400).json({
        RspCode: "97",
        Message: "Invalid signature",
      });
    }

    // Parse response
    const response = parsePaymentResponse(params);
    const orderId = params.vnp_TxnRef;

    // Find payment by transaction_id (orderId = payment._id)
    const payment = await Payment.findById(orderId);
    if (!payment) {
      console.error(`VNPay Webhook: Payment not found: ${orderId}`);
      return res.status(404).json({
        RspCode: "01",
        Message: "Payment not found",
      });
    }

    // Update payment status
    if (response.success && payment.status === "pending") {
      payment.status = "completed";
      payment.transaction_id = response.transactionId?.toString() || params.vnp_TransactionNo;
      await payment.save();

      // Update booking status (B2C - Full Payment)
      await updateBookingAfterPayment(payment);

      // TODO: Create notification
    } else if (!response.success && payment.status === "pending") {
      payment.status = "failed";
      await payment.save();
      console.error(`Payment ${payment._id} failed. Response code: ${response.responseCode}, Message: ${response.message}`);
    }

    // Return success to VNPay
    res.json({
      RspCode: "00",
      Message: "Success",
    });
  } catch (error) {
    console.error("VNPay webhook error:", error);
    res.status(500).json({
      RspCode: "99",
      Message: "Internal error",
    });
  }
};

/**
 * VNPay Return URL Handler (khi user quay lại từ VNPay)
 * GET /api/payments/vnpay-return
 */
export const vnpayReturn = async (req, res) => {
  try {
    const params = req.query;

    // Verify signature
    const isValid = verifyPaymentCallback(params);
    
    if (!isValid) {
      console.error("❌ [VNPay Return] Invalid signature");
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/payments/success?payment=${params.vnp_TxnRef}&error=invalid_signature`
      );
    }

    // Parse response
    const response = parsePaymentResponse(params);
    const orderId = params.vnp_TxnRef;

    // Find payment
    const payment = await Payment.findById(orderId);
    if (!payment) {
      console.error(`❌ [VNPay Return] Payment not found: ${orderId}`);
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/payments/success?payment=${orderId}&error=not_found`
      );
    }

    // Update payment status nếu chưa được update (webhook có thể chưa được gọi)
    if (response.success && payment.status === "pending") {
      payment.status = "completed";
      payment.transaction_id = response.transactionId?.toString() || params.vnp_TransactionNo;
      await payment.save();

      // Update booking status (B2C - Full Payment)
      await updateBookingAfterPayment(payment);
    } else if (!response.success && payment.status === "pending") {
      payment.status = "failed";
      await payment.save();
      console.error(`❌ [VNPay Return] Payment ${payment._id} failed via Return URL. Response code: ${response.responseCode}`);
    }

    // Redirect to frontend success page
    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/payments/success?payment=${payment._id}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ [VNPay Return] Error:", error);
    console.error("❌ [VNPay Return] Error stack:", error.stack);
    const orderId = req.query.vnp_TxnRef || "unknown";
    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/payments/success?payment=${orderId}&error=server_error`
    );
  }
};

/**
 * Check payment status (for polling)
 * GET /api/payments/:id/check-status
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      status: payment.status,
      transaction_id: payment.transaction_id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check payment status",
    });
  }
};

/**
 * Create refund
 * POST /api/payments/:id/refund
 */
export const createRefund = async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const originalPayment = await Payment.findById(req.params.id);
    if (!originalPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (originalPayment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only refund completed payments",
      });
    }

    const refundAmount = amount || originalPayment.amount;

    // Create refund payment
    const refund = await Payment.create({
      booking: originalPayment.booking,
      customer: originalPayment.customer,
      payment_type: "refund",
      amount: refundAmount,
      payment_method: originalPayment.payment_method,
      status: "pending",
      transaction_id: `REFUND-${Date.now()}`,
    });

    // TODO: Process refund through gateway if online payment
    // For now, mark as completed
    refund.status = "completed";
    await refund.save();

    // Link refund to original payment (optional, can add field to schema)
    // originalPayment.refunded_by = refund._id;
    // await originalPayment.save();

    res.status(201).json({
      success: true,
      refund,
      message: "Refund created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create refund",
    });
  }
};

/**
 * Get refunds for a payment
 * GET /api/payments/:id/refunds
 */
export const getRefunds = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Find refunds (refunds have same booking and customer)
    const refunds = await Payment.find({
      booking: payment.booking,
      customer: payment.customer,
      payment_type: "refund",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      refunds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get refunds",
    });
  }
};

/**
 * Get payment summary for booking
 * GET /api/payments/booking/:bookingId/summary
 */
export const getPaymentSummary = async (req, res) => {
  try {
    const bookingId = req.params.bookingId || req.params.id; // Support both param names
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check permission
    const customer = await Customer.findOne({ user: req.user._id });
    if (customer && booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get all payments
    const payments = await Payment.find({ booking: booking._id })
      .populate("customer")
      .sort({ createdAt: -1 });

    // Calculate totals (B2C - Full Payment)
    const rentalFeePaid = payments
      .filter((p) => p.payment_type === "rental_fee" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const extensionFeePaid = payments
      .filter((p) => p.payment_type === "extension_fee" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const penaltyPaid = payments
      .filter((p) => p.payment_type === "penalty" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = payments
      .filter((p) => p.payment_type === "refund" && p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPaid = rentalFeePaid + extensionFeePaid + penaltyPaid - totalRefunded;

    // Calculate remaining
    const finalAmount = booking.final_amount || booking.total_amount;
    const remainingAmount = finalAmount - totalPaid;

    // Get extension requests to calculate extension fee
    const { ExtensionRequest } = await import("../models/booking.model.js");
    const extensionRequests = await ExtensionRequest.find({
      booking: booking._id,
      status: "approved",
    });
    const extensionFee = extensionRequests.reduce(
      (sum, er) => sum + (er.additional_amount || 0),
      0
    );

    // Calculate penalty (if final_amount exists)
    const penalty = booking.final_amount
      ? booking.final_amount - booking.total_amount - extensionFee
      : 0;

    const summary = {
      total_amount: booking.total_amount,
      rental_fee: booking.total_amount, // B2C: Full payment = 100%
      extension_fee: extensionFee,
      penalty,
      discount: 0, // TODO: Calculate from promotion usage
      final_amount: finalAmount,
      paid_amount: totalPaid,
      remaining_amount: remainingAmount > 0 ? remainingAmount : 0,
      breakdown: {
        rental_fee: {
          expected: booking.total_amount,
          paid: rentalFeePaid,
        },
        extension_fee: { expected: extensionFee, paid: extensionFeePaid },
        penalty: { expected: penalty, paid: penaltyPaid },
      },
      payments,
    };

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get payment summary",
    });
  }
};

/**
 * Helper function: Update booking status after payment (B2C - Full Payment)
 */
const updateBookingAfterPayment = async (payment) => {
  try {
    const booking = await Booking.findById(payment.booking);
    if (!booking) {
      console.error(`updateBookingAfterPayment: Booking not found for payment ${payment._id}`);
      return;
    }

    // B2C - Full Payment: Khi rental_fee completed → Confirm booking
    if (payment.payment_type === "rental_fee" && payment.status === "completed") {
      // Check if rental_fee is fully paid (100% total_amount)
      const rentalFeePayments = await Payment.find({
        booking: booking._id,
        payment_type: "rental_fee",
        status: "completed",
      });
      const totalRentalFeePaid = rentalFeePayments.reduce((sum, p) => sum + p.amount, 0);

      // B2C: Full payment = 100% total_amount
      if (totalRentalFeePaid >= booking.total_amount) {
        if (booking.status === "pending") {
          booking.status = "confirmed";
          await booking.save();
        }
      }
    }

    // If all payments are completed after vehicle return, update booking to completed
    if (payment.payment_type === "rental_fee" && payment.status === "completed") {
      if (booking.status === "vehicle_returned") {
        // Check if all payments are done (rental_fee + extension_fee + penalty)
        const allPayments = await Payment.find({
          booking: booking._id,
          payment_type: { $ne: "refund" },
        });
        const totalPaid = allPayments
          .filter((p) => p.status === "completed")
          .reduce((sum, p) => sum + p.amount, 0);

        const finalAmount = booking.final_amount || booking.total_amount;

        if (totalPaid >= finalAmount) {
          booking.status = "completed";
          await booking.save();
        }
      }
    }

    // Extension fee và penalty không ảnh hưởng đến booking status chính
    // Chỉ cần thanh toán để hoàn tất booking
  } catch (error) {
    console.error("Error updating booking after payment:", error);
  }
};
