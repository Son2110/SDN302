import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  createBooking,
  getAvailableVehicles,
  cancelBooking,
  updateBooking,
  deleteBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter
  .get("/available", protect, getAvailableVehicles)
  .get("/my-bookings", protect, authorize("customer"), getMyBookings)
  .get("/all", protect, authorize("staff"), getAllBookings)
  .get("/:id", protect, getBookingById)
  .post("/", protect, authorize("customer"), createBooking)
  .put("/:id", protect, authorize("staff"), updateBooking)
  .put("/:id/cancel", protect, cancelBooking)
  .delete("/:id", protect, authorize("staff"), deleteBooking);

export default bookingRouter;
