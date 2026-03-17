import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";

const notificationRoutes = express.Router();

notificationRoutes.get("/", protect, getMyNotifications);
notificationRoutes.put("/read-all", protect, markAllRead);
notificationRoutes.delete("/all", protect, deleteAllNotifications);
notificationRoutes.put("/:id/read", protect, markNotificationAsRead);
notificationRoutes.delete("/:id", protect, deleteNotification);

export default notificationRoutes;
