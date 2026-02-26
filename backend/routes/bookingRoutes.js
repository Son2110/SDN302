import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  createBooking,
  getAvailableVehicles,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter
  .get("/available", protect, getAvailableVehicles)
  .post("/", protect, authorize("customer"), createBooking);

export default bookingRouter;
