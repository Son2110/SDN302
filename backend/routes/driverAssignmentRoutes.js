import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  assignDriverToBooking,
  respondToAssignment,
} from "../controllers/driverAssignmentController.js";

const driverAssignmentRouter = express.Router();

driverAssignmentRouter
  .post("/", protect, authorize("staff"), assignDriverToBooking)
  .put("/:id/respond", protect, authorize("driver"), respondToAssignment);

export default driverAssignmentRouter;
