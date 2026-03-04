import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createPayment,
  getPaymentById,
  getPayments,
  getBookingPayments,
  processPayment,
  verifyPayment,
  cancelPayment,
  createPaymentUrlForPayment,
  vnpayWebhook,
  vnpayReturn,
  checkPaymentStatus,
  createRefund,
  getRefunds,
  getPaymentSummary,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// VNPay callback routes (no authentication required)
paymentRouter.post("/webhook/vnpay", vnpayWebhook); // IPN - Server-to-server
paymentRouter.get("/vnpay-return", vnpayReturn); // Return URL - User redirect

// All other routes require authentication
paymentRouter.use(protect);

// Core Payment CRUD
paymentRouter.post("/", createPayment);
paymentRouter.get("/", getPayments);
paymentRouter.get("/:id", getPaymentById);
paymentRouter.post("/:id/process", processPayment);
paymentRouter.post("/:id/verify", verifyPayment);
paymentRouter.post("/:id/cancel", cancelPayment);

// Payment URL & Status
paymentRouter.post("/:id/create-payment-url", createPaymentUrlForPayment);
paymentRouter.get("/:id/check-status", checkPaymentStatus);

// Booking Payments
paymentRouter.get("/booking/:bookingId", getBookingPayments);
paymentRouter.get("/booking/:bookingId/summary", getPaymentSummary);

// Refund
paymentRouter.post("/:id/refund", createRefund);
paymentRouter.get("/:id/refunds", getRefunds);

export default paymentRouter;
