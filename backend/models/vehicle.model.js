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
  base_price_per_day: { type: Number, required: true },
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

// --- Charging Station Schema ---
const chargingStationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      // GeoJSON cho tọa độ (dễ tìm trạm gần nhất)
      lat: { type: Number },
      lng: { type: Number },
    },
    total_slots: { type: Number, required: true },
    available_slots: { type: Number, required: true },
    charging_rate: { type: Number }, // VND per kWh
    status: {
      type: String,
      enum: ["active", "maintenance", "closed"],
      default: "active",
    },
  },
  { timestamps: true },
); // Tự động có updatedAt

export const VehicleType = mongoose.model("VehicleType", vehicleTypeSchema);
export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export const ChargingStation = mongoose.model(
  "ChargingStation",
  chargingStationSchema,
);
