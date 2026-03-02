import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  processDepositPayment,
  processFinalPayment,
  getAllPayments,
  getPaymentById,
  getMyPayments,
  getPaymentsByBooking,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter
  .get("/", protect, authorize("staff"), getAllPayments)
  .get("/my-payments", protect, authorize("customer"), getMyPayments)
  .get("/booking/:bookingId", protect, getPaymentsByBooking)
  .get("/:id", protect, authorize("staff"), getPaymentById)
  .post("/deposit", protect, authorize("customer"), processDepositPayment)
  .post("/final", protect, authorize("customer"), processFinalPayment);

export default paymentRouter;
