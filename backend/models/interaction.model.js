import mongoose from "mongoose";

// --- Review ---
const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // Review cái gì?
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },

    review_type: {
      type: String,
      enum: ["driver", "overall"],
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    edit_count: { type: Number, default: 0 }, // Số lần đã sửa (tối đa 1)
  },
  { timestamps: true },
);

export const Review = mongoose.model("Review", reviewSchema);
