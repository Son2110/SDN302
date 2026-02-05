import mongoose from "mongoose";

// --- Base User Schema ---
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    avatar_url: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// --- Customer Schema ---
const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  id_card: { type: String, required: true },
  driver_license: { type: String }, // Có thể null nếu thuê có tài xế
  date_of_birth: { type: Date },
  address: { type: String },
  rating: { type: Number, default: 5.0 },
  total_bookings: { type: Number, default: 0 },
  total_spent: { type: Number, default: 0 },
  loyalty_points: { type: Number, default: 0 },
});

// --- Driver Schema ---
const driverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  license_number: { type: String, required: true, unique: true },
  license_type: { type: String, required: true }, // B2, C, D...
  license_expiry: { type: Date, required: true },
  experience_years: { type: Number, required: true },
  rating: { type: Number, default: 5.0 },
  total_trips: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["available", "busy", "offline"],
    default: "offline",
  },
});

// --- Staff Schema ---
const staffSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  employee_id: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  position: { type: String, required: true },
  hire_date: { type: Date, required: true },
});

export const User = mongoose.model("User", userSchema);
export const Customer = mongoose.model("Customer", customerSchema);
export const Driver = mongoose.model("Driver", driverSchema);
export const Staff = mongoose.model("Staff", staffSchema);
