import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "booking_created",
        "payment_success",
        "driver_assigned",
        "vehicle_handover",
        "extension_status",
        "vehicle_return",
        "general",
      ],
      required: true,
    },
    related_id: { type: mongoose.Schema.Types.ObjectId }, // ID của booking, payment, etc.
    related_model: { type: String }, // "Booking", "Payment", etc.
    is_read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
