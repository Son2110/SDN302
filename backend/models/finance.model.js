import mongoose from "mongoose";

// --- Payment ---
const paymentSchema = new mongoose.Schema(
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

    payment_type: {
      type: String,
      enum: ["deposit", "rental_fee", "extension_fee", "penalty", "refund"],
      required: true,
    },
    amount: { type: Number, required: true },
    payment_method: {
      type: String,
      enum: ["cash", "card", "momo", "zalopay", "vnpay", "bank_transfer"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    transaction_id: { type: String },
    processed_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  },
  { timestamps: { createdAt: "payment_date" } },
);

export const Payment = mongoose.model("Payment", paymentSchema);
