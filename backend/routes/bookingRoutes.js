import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  confirmBooking,
  cancelBooking,
  deliverVehicle,
  returnVehicle,
  calculatePrice,
  checkAvailability,
  requestExtension,
  getExtensionRequests,
  approveExtension,
  rejectExtension,
  assignDriver,
  getDriverAssignment,
  acceptDriverAssignment,
  rejectDriverAssignment,
  getHandovers,
  confirmHandover,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

// All routes require authentication
bookingRouter.use(protect);

// Availability & Calculation (must be before /:id routes)
bookingRouter.post("/calculate-price", calculatePrice);
bookingRouter.get("/check-availability", checkAvailability);

// Core Booking CRUD
bookingRouter.post("/", createBooking);
bookingRouter.get("/", getBookings);
bookingRouter.get("/:id", getBookingById);
bookingRouter.put("/:id", updateBooking);
bookingRouter.delete("/:id", deleteBooking);

// Booking Status Management
bookingRouter.post("/:id/confirm", confirmBooking);
bookingRouter.post("/:id/cancel", cancelBooking);
bookingRouter.post("/:id/deliver", deliverVehicle);
bookingRouter.post("/:id/return", returnVehicle);

// Extension Requests
bookingRouter.post("/:id/extend", requestExtension);
bookingRouter.get("/:id/extension-requests", getExtensionRequests);

// Driver Assignment
bookingRouter.post("/:id/assign-driver", assignDriver);
bookingRouter.get("/:id/driver-assignment", getDriverAssignment);

// Vehicle Handover
bookingRouter.get("/:id/handovers", getHandovers);

// Extension Request Management (separate routes)
bookingRouter.put("/extension-requests/:id/approve", approveExtension);
bookingRouter.put("/extension-requests/:id/reject", rejectExtension);

// Driver Assignment Management (separate routes)
bookingRouter.put("/driver-assignments/:id/accept", acceptDriverAssignment);
bookingRouter.put("/driver-assignments/:id/reject", rejectDriverAssignment);

// Handover Confirmation
bookingRouter.post("/handovers/:id/confirm", confirmHandover);

export default bookingRouter;
