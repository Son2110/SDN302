import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getAllDrivers,
  getDriverById,
  updateDriver,
  registerAsDriver,
  reapplyAsDriver,
  getMyDriverStatus,
  getPendingDrivers,
  getDriverStats,
  approveDriver,
  rejectDriver,
  updateDriverStatus,
  getMyProfile,
  updateUserInfo,
} from "../controllers/userController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==================== PUBLIC / AUTHENTICATED ====================

// Get my profile (any authenticated user)
router.get("/my-profile", protect, getMyProfile);

// Update my basic info (any authenticated user)
router.put("/me", protect, updateUserInfo);

// ==================== CUSTOMER ROUTES ====================

// Get all customers (staff only)
router.get("/customers", protect, authorize("staff"), getAllCustomers);

// Get customer by ID (own profile or staff)
router.get("/customers/:id", protect, getCustomerById);

// Update customer profile (own profile or staff)
router.put("/customers/:id", protect, updateCustomer);

// ==================== DRIVER ROUTES ====================

// Get driver statistics (staff only) - Must be before /:id routes
router.get("/drivers/stats", protect, authorize("staff"), getDriverStats);

// Get pending drivers (staff only) - Must be before /:id routes
router.get("/drivers/pending", protect, authorize("staff"), getPendingDrivers);

// Get all drivers (staff only)
router.get("/drivers", protect, authorize("staff"), getAllDrivers);

// Get driver by ID (own profile or staff)
router.get("/drivers/:id", protect, getDriverById);

// Update driver profile (own profile or staff)
router.put("/drivers/:id", protect, updateDriver);

// Approve driver registration (staff only)
router.patch(
  "/drivers/:id/approve",
  protect,
  authorize("staff"),
  approveDriver,
);

// Reject driver registration (staff only)
router.patch("/drivers/:id/reject", protect, authorize("staff"), rejectDriver);

// Update driver status: available / offline / busy (staff only)
router.patch(
  "/drivers/:id/status",
  protect,
  authorize("staff"),
  updateDriverStatus,
);

// ==================== DRIVER REGISTRATION ====================

// Customer registers to become driver (customer only)
router.post(
  "/driver-registration",
  protect,
  authorize("customer"),
  registerAsDriver,
);

// Customer re-applies after rejection
router.put(
  "/driver-registration",
  protect,
  authorize("customer"),
  reapplyAsDriver,
);

// Customer gets own driver registration status
router.get("/my-driver-status", protect, getMyDriverStatus);

export default router;
