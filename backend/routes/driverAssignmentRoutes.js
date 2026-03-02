import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getAllAssignments,
  getAssignmentById,
  assignDriverToBooking,
  respondToAssignment,
  updateAssignment,
  deleteAssignment,
  getMyAssignments,
} from "../controllers/driverAssignmentController.js";

const driverAssignmentRouter = express.Router();

driverAssignmentRouter
  .get("/", protect, authorize("staff"), getAllAssignments)
  .get("/my-assignments", protect, authorize("driver"), getMyAssignments)
  .get("/:id", protect, authorize("staff", "driver"), getAssignmentById)
  .post("/", protect, authorize("staff"), assignDriverToBooking)
  .put("/:id", protect, authorize("staff"), updateAssignment)
  .put("/:id/respond", protect, authorize("driver"), respondToAssignment)
  .delete("/:id", protect, authorize("staff"), deleteAssignment);

export default driverAssignmentRouter;
