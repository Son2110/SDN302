import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getAllDrivers,
  getDriverById,
  updateDriver,
  registerAsDriver,
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

// Get all drivers (staff only)
router.get("/drivers", protect, authorize("staff"), getAllDrivers);

// Get driver by ID (own profile or staff)
router.get("/drivers/:id", protect, getDriverById);

// Update driver profile (own profile or staff)
router.put("/drivers/:id", protect, updateDriver);

// ==================== DRIVER REGISTRATION ====================

// Customer registers to become driver (customer only)
router.post(
  "/driver-registration",
  protect,
  authorize("customer"),
  registerAsDriver,
);

export default router;
