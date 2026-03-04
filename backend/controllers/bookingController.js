import {
  Booking,
  VehicleHandover,
  DriverAssignment,
  ExtensionRequest,
} from "../models/booking.model.js";
import { Vehicle, VehicleType } from "../models/vehicle.model.js";
import { Customer, Staff, Driver } from "../models/user.model.js";
import { Promotion } from "../models/finance.model.js";

/**
 * Calculate price for booking
 */
const calculateBookingPrice = async (
  vehicleId,
  startDate,
  endDate,
  rentalType,
  promotionCode = null
) => {
  const vehicle = await Vehicle.findById(vehicleId).populate("vehicle_type");
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    throw new Error("End date must be after start date");
  }

  // Base amount = daily_rate * days
  let baseAmount = vehicle.daily_rate * days;

  // Add driver fee if with_driver (estimate 500k/day)
  if (rentalType === "with_driver") {
    baseAmount += 500000 * days;
  }

  // Apply promotion if provided
  let discountAmount = 0;
  if (promotionCode) {
    const promotion = await Promotion.findOne({
      code: promotionCode,
      is_active: true,
      valid_from: { $lte: new Date() },
      valid_to: { $gte: new Date() },
    });

    if (promotion) {
      if (promotion.min_booking_amount && baseAmount < promotion.min_booking_amount) {
        throw new Error("Booking amount does not meet minimum requirement for promotion");
      }

      if (promotion.discount_type === "percentage") {
        discountAmount = (baseAmount * promotion.discount_value) / 100;
        if (promotion.max_discount_amount) {
          discountAmount = Math.min(discountAmount, promotion.max_discount_amount);
        }
      } else {
        discountAmount = promotion.discount_value;
      }
    }
  }

  const totalAmount = baseAmount - discountAmount;
  // B2C: Full payment, không có deposit
  // depositAmount removed - customer pays 100% upfront

  return {
    baseAmount,
    discountAmount,
    totalAmount,
    days,
    dailyRate: vehicle.daily_rate,
  };
};

/**
 * Check if vehicle is available in date range
 */
const checkVehicleAvailability = async (vehicleId, startDate, endDate) => {
  const conflictingBookings = await Booking.find({
    vehicle: vehicleId,
    status: {
      $in: ["pending", "confirmed", "vehicle_delivered", "in_progress"],
    },
    $or: [
      {
        start_date: { $lte: new Date(endDate) },
        end_date: { $gte: new Date(startDate) },
      },
    ],
  });

  return {
    available: conflictingBookings.length === 0,
    conflictingBookings: conflictingBookings.map((b) => ({
      id: b._id,
      start_date: b.start_date,
      end_date: b.end_date,
      status: b.status,
    })),
  };
};

/**
 * Create new booking
 * POST /api/bookings
 */
export const createBooking = async (req, res) => {
  try {
    const {
      vehicle,
      rental_type,
      start_date,
      end_date,
      pickup_location,
      return_location,
      promotion_code,
    } = req.body;

    // Get customer from authenticated user
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found. Please complete your profile.",
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const now = new Date();

    if (startDate < now) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be in the past",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    // Check availability
    const availability = await checkVehicleAvailability(vehicle, start_date, end_date);
    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: "Vehicle is not available in the selected date range",
        conflictingBookings: availability.conflictingBookings,
      });
    }

    // Calculate price
    const priceInfo = await calculateBookingPrice(
      vehicle,
      start_date,
      end_date,
      rental_type,
      promotion_code
    );

    // Calculate max_checkin_time (start_date + 3 hours)
    const maxCheckinTime = new Date(startDate);
    maxCheckinTime.setHours(maxCheckinTime.getHours() + 3);

    // Create booking
    const booking = await Booking.create({
      customer: customer._id,
      vehicle,
      rental_type,
      start_date: startDate,
      end_date: endDate,
      max_checkin_time: maxCheckinTime,
      pickup_location,
      return_location,
      status: "pending",
      total_amount: priceInfo.totalAmount,
      deposit_amount: 0, // B2C: No deposit, full payment upfront
    });

    // Populate related data
    const populatedBooking = await Booking.findById(booking._id)
      .populate("customer")
      .populate("vehicle")
      .populate("driver");

    // Note: Payment will be created separately via /api/payments endpoint
    // This allows customer to review booking before paying

    res.status(201).json({
      success: true,
      booking: populatedBooking,
      priceInfo,
      message: "Booking created. Please proceed to payment to confirm your booking.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create booking",
    });
  }
};

/**
 * Get all bookings
 * GET /api/bookings
 */
export const getBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customer,
      vehicle,
      start_date,
      end_date,
    } = req.query;

    // Build filter
    const filter = {};

    // Customer can only see their own bookings
    const customerDoc = await Customer.findOne({ user: req.user._id });
    if (customerDoc) {
      filter.customer = customerDoc._id;
    } else {
      // If not customer, check if staff
      const staff = await Staff.findOne({ user: req.user._id });
      if (!staff) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
      // Staff can see all bookings, but can filter by customer
      if (customer) {
        filter.customer = customer;
      }
    }

    if (status) {
      filter.status = status;
    }

    if (vehicle) {
      filter.vehicle = vehicle;
    }

    if (start_date || end_date) {
      filter.$or = [];
      if (start_date) {
        filter.$or.push({ start_date: { $gte: new Date(start_date) } });
      }
      if (end_date) {
        filter.$or.push({ end_date: { $lte: new Date(end_date) } });
      }
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const bookings = await Booking.find(filter)
      .populate("customer")
      .populate("vehicle")
      .populate("driver")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get bookings",
    });
  }
};

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer")
      .populate("vehicle")
      .populate("driver")
      .populate("managed_by");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check permission: customer can only see their own bookings
    const customer = await Customer.findOne({ user: req.user._id });
    if (customer && booking.customer._id.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get handovers
    const handovers = await VehicleHandover.find({ booking: booking._id })
      .populate("staff")
      .sort({ handover_time: -1 });

    // Get extension requests
    const extensionRequests = await ExtensionRequest.find({ booking: booking._id })
      .populate("processed_by")
      .sort({ requested_at: -1 });

    // Get driver assignment if exists
    let driverAssignment = null;
    if (booking.rental_type === "with_driver") {
      driverAssignment = await DriverAssignment.findOne({ booking: booking._id })
        .populate("driver")
        .populate("assigned_by");
    }

    res.json({
      success: true,
      booking: {
        ...booking.toObject(),
        handovers,
        extensionRequests,
        driverAssignment,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get booking",
    });
  }
};

/**
 * Update booking
 * PUT /api/bookings/:id
 */
export const updateBooking = async (req, res) => {
  try {
    const { pickup_location, return_location } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check permission
    const customer = await Customer.findOne({ user: req.user._id });
    if (customer && booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Only allow update when pending or confirmed
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update booking in current status",
      });
    }

    // Update allowed fields
    if (pickup_location) booking.pickup_location = pickup_location;
    if (return_location) booking.return_location = return_location;

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer")
      .populate("vehicle")
      .populate("driver");

    res.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update booking",
    });
  }
};

/**
 * Delete booking (only when pending)
 * DELETE /api/bookings/:id
 */
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Only allow delete when pending
    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only delete pending bookings",
      });
    }

    // Check permission
    const customer = await Customer.findOne({ user: req.user._id });
    if (customer && booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete booking",
    });
  }
};

/**
 * Calculate price for booking
 * POST /api/bookings/calculate-price
 */
export const calculatePrice = async (req, res) => {
  try {
    const { vehicle, start_date, end_date, rental_type, promotion_code } = req.body;

    const priceInfo = await calculateBookingPrice(
      vehicle,
      start_date,
      end_date,
      rental_type,
      promotion_code
    );

    res.json({
      success: true,
      ...priceInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate price",
    });
  }
};

/**
 * Check vehicle availability
 * GET /api/bookings/check-availability
 */
export const checkAvailability = async (req, res) => {
  try {
    const { vehicle, start_date, end_date } = req.query;

    if (!vehicle || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "vehicle, start_date, and end_date are required",
      });
    }

    const availability = await checkVehicleAvailability(vehicle, start_date, end_date);

    res.json({
      success: true,
      ...availability,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check availability",
    });
  }
};

/**
 * Confirm booking (staff only)
 * POST /api/bookings/:id/confirm
 */
export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Only staff can confirm bookings",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm booking with status: ${booking.status}`,
      });
    }

    booking.status = "confirmed";
    booking.managed_by = staff._id;
    await booking.save();

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(booking.vehicle, { status: "rented" });

    // TODO: Create notification for customer

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer")
      .populate("vehicle")
      .populate("driver")
      .populate("managed_by");

    res.json({
      success: true,
      booking: updatedBooking,
      message: "Booking confirmed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm booking",
    });
  }
};

/**
 * Cancel booking
 * POST /api/bookings/:id/cancel
 */
export const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check permission
    const customer = await Customer.findOne({ user: req.user._id });
    const staff = await Staff.findOne({ user: req.user._id });

    if (customer) {
      // Customer can only cancel their own bookings when pending or confirmed
      if (booking.customer.toString() !== customer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
      if (!["pending", "confirmed"].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel booking in current status",
        });
      }
    } else if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    booking.status = "cancelled";
    if (staff) {
      booking.managed_by = staff._id;
    }
    await booking.save();

    // Update vehicle status back to available
    await Vehicle.findByIdAndUpdate(booking.vehicle, { status: "available" });

    // TODO: Handle refund if payment was made
    // TODO: Create notification

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer")
      .populate("vehicle")
      .populate("driver");

    // Calculate refund based on cancellation time (B2C)
    const now = new Date();
    const bookingDate = new Date(booking.createdAt);
    const hoursSinceBooking = (now - bookingDate) / (1000 * 60 * 60);
    
    let refundAmount = 0;
    let refundPercentage = 0;
    
    if (hoursSinceBooking <= 24) {
      // Hủy trước 24h → Hoàn lại 100%
      refundAmount = booking.total_amount;
      refundPercentage = 100;
    } else if (booking.status === "pending" || booking.status === "confirmed") {
      // Hủy sau 24h nhưng trước khi nhận xe → Hoàn lại 70%
      refundAmount = booking.total_amount * 0.7;
      refundPercentage = 70;
    } else {
      // Hủy sau khi nhận xe → Không hoàn tiền
      refundAmount = 0;
      refundPercentage = 0;
    }

    res.json({
      success: true,
      booking: updatedBooking,
      message: "Booking cancelled successfully",
      refund: {
        amount: refundAmount,
        percentage: refundPercentage,
        status: refundAmount > 0 ? "pending" : "none", // TODO: Process refund
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel booking",
    });
  }
};

/**
 * Deliver vehicle (staff only)
 * POST /api/bookings/:id/deliver
 */
export const deliverVehicle = async (req, res) => {
  try {
    const { mileage, fuel_level_percentage, notes, customer_signature } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Only staff can deliver vehicles",
      });
    }

    if (!["confirmed", "vehicle_delivered"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot deliver vehicle with status: ${booking.status}`,
      });
    }

    // Create vehicle handover
    const handover = await VehicleHandover.create({
      booking: booking._id,
      vehicle: booking.vehicle,
      staff: staff._id,
      handover_type: "delivery",
      mileage,
      fuel_level_percentage,
      notes,
      customer_signature,
      confirmed_by_customer: !!customer_signature,
    });

    // Update booking status
    booking.status = booking.status === "confirmed" ? "vehicle_delivered" : "in_progress";
    booking.managed_by = staff._id;
    await booking.save();

    // Update vehicle status
    if (booking.status === "in_progress") {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: "rented" });
    }

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer")
      .populate("vehicle")
      .populate("driver");

    res.json({
      success: true,
      booking: updatedBooking,
      handover,
      message: "Vehicle delivered successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to deliver vehicle",
    });
  }
};

/**
 * Return vehicle (staff only)
 * POST /api/bookings/:id/return
 */
export const returnVehicle = async (req, res) => {
  try {
    const {
      actual_return_date,
      mileage,
      fuel_level_percentage,
      notes,
      damages,
    } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Only staff can process vehicle returns",
      });
    }

    if (booking.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: `Cannot return vehicle with status: ${booking.status}`,
      });
    }

    const returnDate = actual_return_date ? new Date(actual_return_date) : new Date();
    const originalEndDate = new Date(booking.end_date);

    // Calculate penalties
    let penaltyAmount = 0;
    const penalties = [];

    // Late return penalty (100k per day)
    if (returnDate > originalEndDate) {
      const lateDays = Math.ceil(
        (returnDate - originalEndDate) / (1000 * 60 * 60 * 24)
      );
      const latePenalty = lateDays * 100000;
      penaltyAmount += latePenalty;
      penalties.push({
        type: "late_return",
        days: lateDays,
        amount: latePenalty,
      });
    }

    // Fuel penalty (if fuel level is less than when delivered)
    const deliveryHandover = await VehicleHandover.findOne({
      booking: booking._id,
      handover_type: "delivery",
    }).sort({ handover_time: -1 });

    if (deliveryHandover && fuel_level_percentage < deliveryHandover.fuel_level_percentage) {
      const fuelDiff = deliveryHandover.fuel_level_percentage - fuel_level_percentage;
      const fuelPenalty = Math.ceil((fuelDiff / 100) * 500000); // Estimate 500k per 100% fuel
      penaltyAmount += fuelPenalty;
      penalties.push({
        type: "fuel_penalty",
        difference: fuelDiff,
        amount: fuelPenalty,
      });
    }

    // Damage penalty (if any)
    if (damages && damages.length > 0) {
      // Simple estimate: 1M per damage
      const damagePenalty = damages.length * 1000000;
      penaltyAmount += damagePenalty;
      penalties.push({
        type: "damage_penalty",
        count: damages.length,
        amount: damagePenalty,
      });
    }

    // Calculate final amount
    const finalAmount = booking.total_amount + penaltyAmount;

    // Create vehicle handover
    const handover = await VehicleHandover.create({
      booking: booking._id,
      vehicle: booking.vehicle,
      staff: staff._id,
      handover_type: "return",
      mileage,
      fuel_level_percentage,
      notes,
    });

    // Update booking
    booking.status = "vehicle_returned";
    booking.actual_return_date = returnDate;
    booking.final_amount = finalAmount;
    booking.managed_by = staff._id;
    await booking.save();

    // Update vehicle status and mileage
    await Vehicle.findByIdAndUpdate(booking.vehicle, {
      status: "available",
      current_mileage: mileage,
    });

    // Auto-complete after 1 hour (or can be done manually)
    setTimeout(async () => {
      const updatedBooking = await Booking.findById(booking._id);
      if (updatedBooking && updatedBooking.status === "vehicle_returned") {
        updatedBooking.status = "completed";
        await updatedBooking.save();
      }
    }, 60 * 60 * 1000); // 1 hour

    const updatedBooking = await Booking.findById(booking._id)
      .populate("customer")
      .populate("vehicle")
      .populate("driver");

    res.json({
      success: true,
      booking: updatedBooking,
      handover,
      finalAmount,
      penaltyAmount,
      penalties,
      message: "Vehicle returned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to return vehicle",
    });
  }
};

/**
 * Request extension
 * POST /api/bookings/:id/extend
 */
export const requestExtension = async (req, res) => {
  try {
    const { new_end_date, reason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check permission
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer || booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!["in_progress", "vehicle_delivered"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Can only request extension for active bookings",
      });
    }

    const newEndDate = new Date(new_end_date);
    const originalEndDate = new Date(booking.end_date);

    if (newEndDate <= originalEndDate) {
      return res.status(400).json({
        success: false,
        message: "New end date must be after original end date",
      });
    }

    const daysExtended = Math.ceil(
      (newEndDate - originalEndDate) / (1000 * 60 * 60 * 24)
    );

    // Check for conflicts
    const availability = await checkVehicleAvailability(
      booking.vehicle.toString(),
      booking.end_date,
      new_end_date
    );

    // Calculate additional amount
    const vehicle = await Vehicle.findById(booking.vehicle).populate("vehicle_type");
    const additionalAmount = vehicle.daily_rate * daysExtended;
    if (booking.rental_type === "with_driver") {
      additionalAmount += 500000 * daysExtended;
    }

    const extensionRequest = await ExtensionRequest.create({
      booking: booking._id,
      customer: customer._id,
      original_end_date: originalEndDate,
      new_end_date: newEndDate,
      days_extended: daysExtended,
      has_conflict: !availability.available,
      additional_amount: additionalAmount,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      extensionRequest,
      additionalAmount,
      hasConflict: !availability.available,
      conflictingBookings: availability.conflictingBookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to request extension",
    });
  }
};

/**
 * Get extension requests for a booking
 * GET /api/bookings/:id/extension-requests
 */
export const getExtensionRequests = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const extensionRequests = await ExtensionRequest.find({ booking: booking._id })
      .populate("customer")
      .populate("processed_by")
      .populate("alternative_vehicle")
      .sort({ requested_at: -1 });

    res.json({
      success: true,
      extensionRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get extension requests",
    });
  }
};

/**
 * Approve extension request (staff only)
 * PUT /api/extension-requests/:id/approve
 */
export const approveExtension = async (req, res) => {
  try {
    const { alternative_vehicle } = req.body;

    const extensionRequest = await ExtensionRequest.findById(req.params.id);
    if (!extensionRequest) {
      return res.status(404).json({
        success: false,
        message: "Extension request not found",
      });
    }

    // Check if user is staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Only staff can approve extension requests",
      });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Extension request already processed",
      });
    }

    const booking = await Booking.findById(extensionRequest.booking);

    // If has conflict and alternative vehicle provided
    if (extensionRequest.has_conflict && alternative_vehicle) {
      // Update booking with alternative vehicle
      booking.vehicle = alternative_vehicle;
      extensionRequest.alternative_vehicle = alternative_vehicle;
      extensionRequest.status = "alternative_offered";
    } else {
      // Update booking end date
      booking.end_date = extensionRequest.new_end_date;
      booking.total_amount += extensionRequest.additional_amount;
      extensionRequest.status = "approved";
    }

    extensionRequest.processed_by = staff._id;
    await extensionRequest.save();
    await booking.save();

    // TODO: Create payment for additional amount
    // TODO: Create notification

    res.json({
      success: true,
      extensionRequest,
      booking,
      message: "Extension request processed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to approve extension",
    });
  }
};

/**
 * Reject extension request (staff only)
 * PUT /api/extension-requests/:id/reject
 */
export const rejectExtension = async (req, res) => {
  try {
    const { reason } = req.body;

    const extensionRequest = await ExtensionRequest.findById(req.params.id);
    if (!extensionRequest) {
      return res.status(404).json({
        success: false,
        message: "Extension request not found",
      });
    }

    // Check if user is staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Only staff can reject extension requests",
      });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Extension request already processed",
      });
    }

    extensionRequest.status = "rejected";
    extensionRequest.processed_by = staff._id;
    await extensionRequest.save();

    // TODO: Create notification

    res.json({
      success: true,
      extensionRequest,
      message: "Extension request rejected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reject extension",
    });
  }
};

/**
 * Assign driver to booking (staff only)
 * POST /api/bookings/:id/assign-driver
 */
export const assignDriver = async (req, res) => {
  try {
    const { driver_id } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.rental_type !== "with_driver") {
      return res.status(400).json({
        success: false,
        message: "This booking does not require a driver",
      });
    }

    // Check if user is staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        success: false,
        message: "Only staff can assign drivers",
      });
    }

    // Check if driver exists and is available
    const driver = await Driver.findById(driver_id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    if (driver.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Driver is not available",
      });
    }

    // Create or update driver assignment
    let driverAssignment = await DriverAssignment.findOne({ booking: booking._id });
    if (driverAssignment) {
      driverAssignment.driver = driver_id;
      driverAssignment.status = "pending";
      driverAssignment.assigned_by = staff._id;
      await driverAssignment.save();
    } else {
      driverAssignment = await DriverAssignment.create({
        booking: booking._id,
        driver: driver_id,
        assigned_by: staff._id,
        status: "pending",
      });
    }

    // Update booking
    booking.driver = driver_id;
    await booking.save();

    const populatedAssignment = await DriverAssignment.findById(driverAssignment._id)
      .populate("driver")
      .populate("assigned_by");

    res.json({
      success: true,
      driverAssignment: populatedAssignment,
      message: "Driver assigned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to assign driver",
    });
  }
};

/**
 * Get driver assignment for booking
 * GET /api/bookings/:id/driver-assignment
 */
export const getDriverAssignment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const driverAssignment = await DriverAssignment.findOne({ booking: booking._id })
      .populate("driver")
      .populate("assigned_by");

    res.json({
      success: true,
      driverAssignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get driver assignment",
    });
  }
};

/**
 * Accept driver assignment (driver only)
 * PUT /api/driver-assignments/:id/accept
 */
export const acceptDriverAssignment = async (req, res) => {
  try {
    const driverAssignment = await DriverAssignment.findById(req.params.id);
    if (!driverAssignment) {
      return res.status(404).json({
        success: false,
        message: "Driver assignment not found",
      });
    }

    // Check if user is the assigned driver
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver || driverAssignment.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    driverAssignment.status = "accepted";
    await driverAssignment.save();

    // Update driver status
    await Driver.findByIdAndUpdate(driver._id, { status: "busy" });

    res.json({
      success: true,
      driverAssignment,
      message: "Driver assignment accepted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to accept driver assignment",
    });
  }
};

/**
 * Reject driver assignment (driver only)
 * PUT /api/driver-assignments/:id/reject
 */
export const rejectDriverAssignment = async (req, res) => {
  try {
    const { response_note } = req.body;

    const driverAssignment = await DriverAssignment.findById(req.params.id);
    if (!driverAssignment) {
      return res.status(404).json({
        success: false,
        message: "Driver assignment not found",
      });
    }

    // Check if user is the assigned driver
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver || driverAssignment.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    driverAssignment.status = "rejected";
    driverAssignment.response_note = response_note;
    await driverAssignment.save();

    res.json({
      success: true,
      driverAssignment,
      message: "Driver assignment rejected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reject driver assignment",
    });
  }
};

/**
 * Get handovers for booking
 * GET /api/bookings/:id/handovers
 */
export const getHandovers = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const handovers = await VehicleHandover.find({ booking: booking._id })
      .populate("staff")
      .populate("vehicle")
      .sort({ handover_time: -1 });

    res.json({
      success: true,
      handovers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get handovers",
    });
  }
};

/**
 * Confirm handover (customer)
 * POST /api/handovers/:id/confirm
 */
export const confirmHandover = async (req, res) => {
  try {
    const { customer_signature } = req.body;

    const handover = await VehicleHandover.findById(req.params.id);
    if (!handover) {
      return res.status(404).json({
        success: false,
        message: "Handover not found",
      });
    }

    // Check permission
    const booking = await Booking.findById(handover.booking);
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer || booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    handover.confirmed_by_customer = true;
    handover.customer_signature = customer_signature;
    await handover.save();

    res.json({
      success: true,
      handover,
      message: "Handover confirmed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm handover",
    });
  }
};

// Payment summary is now handled in paymentController
// This endpoint is moved to payment routes

// Export helper functions for use in other controllers
export { calculateBookingPrice, checkVehicleAvailability };
