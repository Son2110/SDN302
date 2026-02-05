import mongoose from "mongoose";

// --- Booking Schema ---
const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    }, // Null nếu tự lái
    managed_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },

    rental_type: {
      type: String,
      enum: ["self_drive", "with_driver"],
      required: true,
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    actual_return_date: { type: Date },
    max_checkin_time: { type: Date }, // start_date + 3h

    pickup_location: { type: String },
    return_location: { type: String },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "vehicle_delivered",
        "in_progress",
        "vehicle_returned",
        "completed",
        "cancelled",
        "deposit_lost",
      ],
      default: "pending",
    },

    total_amount: { type: Number, required: true },
    deposit_amount: { type: Number, required: true },
    final_amount: { type: Number }, // Tính sau khi trả xe
  },
  { timestamps: true },
);

// --- Vehicle Handover (Biên bản bàn giao) ---
const vehicleHandoverSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },

  handover_type: { type: String, enum: ["delivery", "return"], required: true },
  handover_time: { type: Date, default: Date.now },

  mileage: { type: Number },
  fuel_level_percentage: { type: Number },
  notes: { type: String },

  confirmed_by_customer: { type: Boolean, default: false },
  customer_signature: { type: Object }, // JSON signature data
});

// --- Driver Assignment ---
const driverAssignmentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  assigned_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  assigned_at: { type: Date, default: Date.now },
  response_note: { type: String },
});

// --- Extension Request ---
const extensionRequestSchema = new mongoose.Schema(
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

    original_end_date: { type: Date, required: true },
    new_end_date: { type: Date, required: true },
    days_extended: { type: Number, required: true },

    has_conflict: { type: Boolean, default: false },
    alternative_vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "alternative_offered"],
      default: "pending",
    },
    processed_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    additional_amount: { type: Number },
  },
  { timestamps: { createdAt: "requested_at", updatedAt: "processed_at" } },
);

export const Booking = mongoose.model("Booking", bookingSchema);
export const VehicleHandover = mongoose.model(
  "VehicleHandover",
  vehicleHandoverSchema,
);
export const DriverAssignment = mongoose.model(
  "DriverAssignment",
  driverAssignmentSchema,
);
export const ExtensionRequest = mongoose.model(
  "ExtensionRequest",
  extensionRequestSchema,
);
