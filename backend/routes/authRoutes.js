import express from "express";
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const authRouters = express.Router();

authRouters
  .post("/register", register)
  .post("/login", login)
  .post("/forgot-password", forgotPassword)
  .post("/reset-password", resetPassword)
  .get("/me", protect, getMe);

export default authRouters;
