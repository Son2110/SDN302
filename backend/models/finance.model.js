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
      enum: ["cash", "card", "momo", "zalopay", "vnpay"],
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

// --- Promotion ---
const promotionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },

  discount_type: { type: String, enum: ["percentage", "fixed_amount"] },
  discount_value: { type: Number, required: true },
  max_discount_amount: { type: Number },
  min_booking_amount: { type: Number },

  valid_from: { type: Date, required: true },
  valid_to: { type: Date, required: true },
  is_active: { type: Boolean, default: true },
});

// --- Financial Report (Lưu snapshot báo cáo) ---
const financialReportSchema = new mongoose.Schema(
  {
    report_type: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly", "custom"],
      required: true,
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },

    total_revenue: { type: Number, default: 0 },
    total_bookings: { type: Number, default: 0 },

    // Lưu dạng JSON object cho các thống kê chi tiết
    revenue_by_vehicle_type: { type: Object },
    revenue_by_payment_method: { type: Object },
    top_customers: { type: Array },

    generated_by: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  },
  { timestamps: { createdAt: "generated_at" } },
);

// --- Promotion Usage ---
const promotionUsageSchema = new mongoose.Schema(
  {
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      required: true,
    },
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
    discount_amount: { type: Number, required: true },
  },
  { timestamps: { createdAt: "used_at", updatedAt: false } },
);

// --- Revenue Detail ---
const revenueDetailSchema = new mongoose.Schema({
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FinancialReport",
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

  booking_date: { type: Date },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },

  rental_days: { type: Number },
  base_amount: { type: Number },
  extension_amount: { type: Number },
  penalty_amount: { type: Number },
  discount_amount: { type: Number },
  final_amount: { type: Number },
});

export const Payment = mongoose.model("Payment", paymentSchema);
export const Promotion = mongoose.model("Promotion", promotionSchema);
export const PromotionUsage = mongoose.model(
  "PromotionUsage",
  promotionUsageSchema,
);
export const FinancialReport = mongoose.model(
  "FinancialReport",
  financialReportSchema,
);
export const RevenueDetail = mongoose.model(
  "RevenueDetail",
  revenueDetailSchema,
);
