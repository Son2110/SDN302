import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  getAllVehicleTypes,
  createVehicleType,
} from "../controllers/vehicleController.js";

const vehicleRouter = express.Router();

// --- Vehicle Types routes (phải đặt TRƯỚC /:id để tránh bắt nhầm) ---
vehicleRouter
  .get("/types", protect, authorize("staff"), getAllVehicleTypes)
  .post("/types", protect, authorize("staff"), createVehicleType);

// --- Vehicle CRUD routes ---
vehicleRouter
  .get("/", protect, authorize("staff"), getAllVehicles)
  .get("/:id", protect, authorize("staff"), getVehicleById)
  .post("/", protect, authorize("staff"), createVehicle)
  .put("/:id", protect, authorize("staff"), updateVehicle)
  .patch("/:id/status", protect, authorize("staff"), updateVehicleStatus)
  .delete("/:id", protect, authorize("staff"), deleteVehicle);

export default vehicleRouter;
