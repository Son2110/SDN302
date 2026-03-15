import mongoose from "mongoose";
import { Review } from "../models/interaction.model.js";
import { Booking } from "../models/booking.model.js";
import { Customer, Driver } from "../models/user.model.js";

// ==================== TẠO REVIEW ====================
// @route POST /api/reviews
// @access Private (Customer)
export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, review_type } = req.body;
    const userId = req.user._id;

    // --- Validate input ---
    if (!bookingId || !rating || !review_type) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp bookingId, rating và review_type",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating phải từ 1 đến 5",
      });
    }

    if (!["overall", "driver"].includes(review_type)) {
      return res.status(400).json({
        success: false,
        message: "review_type phải là 'overall' hoặc 'driver'",
      });
    }

    // --- Tìm customer từ user đang login ---
    const customer = await Customer.findOne({ user: userId });
    if (!customer) {
      return res.status(403).json({
        success: false,
        message: "Chỉ customer mới có thể đánh giá",
      });
    }

    // --- Tìm booking và kiểm tra ---
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Check customer đúng chủ booking
    if (booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải chủ booking này",
      });
    }

    // Check booking đã completed chưa
    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ có thể đánh giá khi đơn đã hoàn thành (status: completed)",
      });
    }

    // Nếu review driver → check booking phải có driver (with_driver)
    if (review_type === "driver") {
      if (booking.rental_type !== "with_driver" || !booking.driver) {
        return res.status(400).json({
          success: false,
          message:
            "Không thể đánh giá tài xế vì đơn này là tự lái (self_drive)",
        });
      }
    }

    // --- Check trùng review (cùng booking + cùng customer + cùng review_type) ---
    const existingReview = await Review.findOne({
      booking: bookingId,
      customer: customer._id,
      review_type,
    });

    if (existingReview) {
      const typeLabel = review_type === "driver" ? "tài xế" : "chuyến đi";
      return res.status(400).json({
        success: false,
        message: `Bạn đã đánh giá ${typeLabel} cho booking này rồi`,
      });
    }

    // --- Tạo review ---
    const reviewData = {
      booking: bookingId,
      customer: customer._id,
      vehicle: booking.vehicle,
      review_type,
      rating,
      comment: comment || "",
    };

    // Nếu review driver → gán driver vào review
    if (review_type === "driver") {
      reviewData.driver = booking.driver;
    }

    const review = await Review.create(reviewData);

    // --- Cập nhật rating trung bình cho driver ---
    if (review_type === "driver" && booking.driver) {
      await updateDriverRating(booking.driver);
    }

    const typeLabel = review_type === "driver" ? "tài xế" : "chuyến đi";
    return res.status(201).json({
      success: true,
      message: `Đánh giá ${typeLabel} thành công`,
      data: review,
    });
  } catch (error) {
    console.error("createReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đánh giá",
      error: error.message,
    });
  }
};

// ==================== XEM REVIEW THEO BOOKING ====================
// @route GET /api/reviews/booking/:bookingId
// @access Private
export const getReviewsByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const reviews = await Review.find({ booking: bookingId })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name avatar_url" },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("getReviewsByBooking error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đánh giá",
      error: error.message,
    });
  }
};

// ==================== XEM REVIEW THEO DRIVER ====================
// @route GET /api/reviews/driver/:driverId
// @access Private
export const getDriverReviews = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài xế",
      });
    }

    const reviews = await Review.find({
      driver: driverId,
      review_type: "driver",
    })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name avatar_url" },
      })
      .populate({
        path: "booking",
        select: "start_date end_date rental_type pickup_location",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reviews,
      average_rating: driver.rating,
      total_reviews: reviews.length,
    });
  } catch (error) {
    console.error("getDriverReviews error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đánh giá tài xế",
      error: error.message,
    });
  }
};

// ==================== SỬA REVIEW (tối đa 1 lần) ====================
// @route PUT /api/reviews/:reviewId
// @access Private (Customer)
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // --- Tìm customer từ user đang login ---
    const customer = await Customer.findOne({ user: userId });
    if (!customer) {
      return res.status(403).json({
        success: false,
        message: "Chỉ customer mới có thể sửa đánh giá",
      });
    }

    // --- Tìm review ---
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    // Check đúng chủ review
    if (review.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải chủ đánh giá này",
      });
    }

    // Check đã sửa chưa (chỉ cho sửa 1 lần)
    if (review.edit_count >= 1) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã sửa đánh giá này rồi (chỉ được sửa 1 lần)",
      });
    }

    // --- Validate input ---
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating phải từ 1 đến 5",
      });
    }

    // --- Cập nhật ---
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    review.edit_count = 1;

    await review.save();

    // Cập nhật lại rating trung bình
    if (review.review_type === "driver" && review.driver) {
      await updateDriverRating(review.driver);
    }

    return res.status(200).json({
      success: true,
      message: "Sửa đánh giá thành công",
      data: review,
    });
  } catch (error) {
    console.error("updateReview error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi sửa đánh giá",
      error: error.message,
    });
  }
};

// ==================== HELPER: Cập nhật rating trung bình cho Driver ====================
const updateDriverRating = async (driverId) => {
  const id = new mongoose.Types.ObjectId(driverId);
  const result = await Review.aggregate([
    {
      $match: {
        driver: id,
        review_type: "driver",
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Driver.findByIdAndUpdate(driverId, {
      rating: Math.round(result[0].averageRating * 10) / 10,
      total_trips: result[0].totalReviews,
    });
  }
};
