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
      enum: ["vehicle", "driver", "overall"],
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// --- Notification ---
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: { type: String, required: true }, // booking_confirmed, payment_due...
    title: { type: String, required: true },
    message: { type: String, required: true },

    is_read: { type: Boolean, default: false },
    related_booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    action_url: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Review = mongoose.model("Review", reviewSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
