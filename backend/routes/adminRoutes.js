import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getRevenueStats,
  getAllUsersAdmin,
  updateUserRole,
  toggleUserStatus,
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// All admin routes require login + admin role
adminRouter.use(protect, authorize("admin"));

adminRouter.get("/revenue", getRevenueStats);
adminRouter.get("/users", getAllUsersAdmin);
adminRouter.patch("/users/:userId/role", updateUserRole);
adminRouter.patch("/users/:userId/status", toggleUserStatus);

export default adminRouter;
