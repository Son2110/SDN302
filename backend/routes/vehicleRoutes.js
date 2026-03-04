import express from "express";
import {
  getVehicles,
  getVehicleById,
  getVehicleTypes,
  searchVehicles,
  getAvailableVehicles,
} from "../controllers/vehicleController.js";

const vehicleRouter = express.Router();

// Public routes (không cần authentication)
vehicleRouter.get("/", getVehicles);
vehicleRouter.get("/types", getVehicleTypes);
vehicleRouter.get("/search", searchVehicles);
vehicleRouter.get("/available", getAvailableVehicles);
vehicleRouter.get("/:id", getVehicleById);

export default vehicleRouter;
