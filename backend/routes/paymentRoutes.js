import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { processDepositPayment } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post(
  "/deposit",
  protect,
  authorize("customer"),
  processDepositPayment,
);

export default paymentRouter;
