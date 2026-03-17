import mongoose from "mongoose";

// --- Vehicle Type Schema ---
const vehicleTypeSchema = new mongoose.Schema({
  type_name: { type: String, required: true }, // VD: Sedan 4 chỗ
  category: {
    type: String,
    enum: ["sedan", "suv", "van", "luxury"],
    default: "sedan",
  },
  seat_capacity: { type: Number, required: true },
  transmission: { type: String, enum: ["auto", "manual"], default: "auto" },
  fuel_type: {
    type: String,
    enum: ["gasoline", "diesel", "electric", "hybrid"],
  },
  battery_capacity_kwh: { type: Number }, // Dung lượng pin (kWh) — chỉ dùng cho xe điện/hybrid
  base_price_per_day: { type: Number, required: true },
  charging_cost_per_kwh: { type: Number, default: 3500 }, // Giá sạc VND/kWh (mặc định 3,500đ)
  image_url: { type: String },
});

// --- Vehicle Schema ---
const vehicleSchema = new mongoose.Schema({
  vehicle_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VehicleType",
    required: true,
  },
  license_plate: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  color: { type: String },
  status: {
    type: String,
    enum: ["available", "rented", "maintenance"],
    default: "available",
    required: true,
  },
  daily_rate: { type: Number, required: true }, // Giá thực tế của xe này
  is_electric: { type: Boolean, default: false },
  current_mileage: { type: Number, default: 0 },
  image_urls: [{ type: String }], // Array string thay vì json thuần
});

export const VehicleType = mongoose.model("VehicleType", vehicleTypeSchema);
export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
