import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllRead,
} from "../controllers/notificationController.js";

const notificationRoutes = express.Router();

notificationRoutes.get("/", protect, getMyNotifications);
notificationRoutes.put("/read-all", protect, markAllRead);
notificationRoutes.put("/:id/read", protect, markNotificationAsRead);

export default notificationRoutes;
