import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  createReview,
  updateReview,
  getReviewsByBooking,
  getDriverReviews,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter
  .post("/", protect, authorize("customer"), createReview)
  .put("/:reviewId", protect, authorize("customer"), updateReview)
  .get("/booking/:bookingId", getReviewsByBooking)
  .get("/driver/:driverId", getDriverReviews);

export default reviewRouter;
