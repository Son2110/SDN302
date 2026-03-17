import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  createReview,
  updateReview,
  getReviewsByBooking,
  getDriverReviews,
  getAllDriverReviews,
  getReviewById,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter
  .post("/", protect, authorize("customer"), createReview)
  .put("/:reviewId", protect, authorize("customer"), updateReview)
  .get("/all-driver-reviews", protect, authorize("staff"), getAllDriverReviews)
  .get("/booking/:bookingId", getReviewsByBooking)
  .get("/driver/:driverId", getDriverReviews)
  .get("/:reviewId", protect, authorize("staff"), getReviewById);

export default reviewRouter;

