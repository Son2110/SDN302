import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  createDeliveryHandover,
  createReturnHandover,
  getAllHandovers,
  getHandoverById,
  getHandoversByBooking,
  confirmDeliveryReceipt,
} from "../controllers/handoverController.js";

const handoverRouter = express.Router();

handoverRouter
  .get("/", protect, authorize("staff"), getAllHandovers)
  .get("/booking/:bookingId", protect, getHandoversByBooking)
  .put("/:id/confirm-receipt", protect, authorize("customer"), confirmDeliveryReceipt)
  .get("/:id", protect, authorize("staff"), getHandoverById)
  .post("/delivery", protect, authorize("staff"), createDeliveryHandover)
  .post("/return", protect, authorize("staff"), createReturnHandover);

export default handoverRouter;
