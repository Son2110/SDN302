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
import { upload } from "../config/cloudinary.js";

const vehicleRouter = express.Router();

// --- Vehicle Types routes (phải đặt TRƯỚC /:id để tránh bắt nhầm) ---
vehicleRouter.get("/types", protect, authorize("staff"), getAllVehicleTypes);
vehicleRouter.post("/types", protect, authorize("staff"), createVehicleType);

// --- Vehicle CRUD routes ---
vehicleRouter.get("/", protect, authorize("staff"), getAllVehicles);
vehicleRouter.get("/:id", protect, authorize("staff"), getVehicleById);

// Thêm middleware upload.array('image_urls') để xử lý upload ảnh
// 'image_urls' là tên field trong form-data
vehicleRouter.post(
  "/",
  protect,
  authorize("staff"),
  upload.array("images", 5),
  createVehicle,
);

vehicleRouter.put(
  "/:id",
  protect,
  authorize("staff"),
  upload.array("images", 5),
  updateVehicle,
);

vehicleRouter.patch(
  "/:id/status",
  protect,
  authorize("staff"),
  updateVehicleStatus,
);
vehicleRouter.delete("/:id", protect, authorize("staff"), deleteVehicle);

export default vehicleRouter;
