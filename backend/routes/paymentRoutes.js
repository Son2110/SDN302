import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  processDepositPayment,
  processFinalPayment,
  getAllPayments,
  getPaymentById,
  getMyPayments,
  getPaymentsByBooking,
  createVnpayPayment,
  vnpayReturn,
  vnpayIpn,
  getPaymentByTxnRef,
  verifyVnpayPayment,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// VNPay: public (no auth) - đặt trước các route có :id
paymentRouter.get("/vnpay/return", vnpayReturn);
paymentRouter.get("/vnpay/ipn", vnpayIpn);

// VNPay: customer
paymentRouter.post("/vnpay/create", protect, authorize("customer"), createVnpayPayment);
paymentRouter.post("/vnpay/verify", protect, authorize("customer"), verifyVnpayPayment);
paymentRouter.get("/by-txn/:txnRef", protect, authorize("customer"), getPaymentByTxnRef);

paymentRouter
  .get("/", protect, authorize("staff"), getAllPayments)
  .get("/my-payments", protect, authorize("customer"), getMyPayments)
  .get("/booking/:bookingId", protect, getPaymentsByBooking)
  .get("/:id", protect, authorize("staff"), getPaymentById)
  .post("/deposit", protect, authorize("customer"), processDepositPayment)
  .post("/final", protect, authorize("customer"), processFinalPayment);

export default paymentRouter;
