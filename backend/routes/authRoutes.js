import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const authRouters = express.Router();

authRouters
  .post("/register", register)
  .post("/login", login)
  .get("/me", protect, getMe);

export default authRouters;
