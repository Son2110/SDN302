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
        "booking_approved",
        "payment_success",
        "payment_overdue",
        "pickup_reminder",
        "return_reminder",
        "return_overdue",
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
    event_key: { type: String, default: null }, // Dedupe key for scheduled notifications
    is_read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, event_key: 1 }, { unique: true, sparse: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
