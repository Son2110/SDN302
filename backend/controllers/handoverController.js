import { Booking, VehicleHandover, DriverAssignment } from "../models/booking.model.js";
import { Vehicle, VehicleType } from "../models/vehicle.model.js";
import { Staff, Customer, Driver } from "../models/user.model.js";
import { sendNotification } from "../utils/notificationSender.js";

// @route POST /api/handovers/delivery
// @access Private (Staff only)
export const createDeliveryHandover = async (req, res) => {
  try {
    const {
      booking_id,
      mileage,
      battery_level_percentage,
      notes,
      customer_signature,
    } = req.body;

    // 1. Verify Staff creating the record
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res
        .status(403)
        .json({ message: "Only staff can create handover records." });
    }

    // 2. Find Booking
    const booking = await Booking.findById(booking_id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    // 3. Check Booking status (Only deliver when booking is confirmed)
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: `Booking is in status ${booking.status}, cannot handover vehicle.`,
      });
    }

    // 3.5. Check if delivery handover already exists (prevent duplicates)
    const existingHandover = await VehicleHandover.findOne({
      booking: booking._id,
      handover_type: "delivery",
    });
    if (existingHandover) {
      return res.status(400).json({
        message: "This booking already has a delivery handover record.",
      });
    }

    // 4. Get current vehicle information
    const vehicle = await Vehicle.findById(booking.vehicle);
    if (!vehicle)
      return res
        .status(404)
        .json({ message: "Error: Vehicle data not found." });

    // 5. 🟢 CREATE HANDOVER RECORD (DELIVERY TO CUSTOMER)
    const newHandover = await VehicleHandover.create({
      booking: booking._id,
      vehicle: vehicle._id,
      staff: staff._id,
      handover_type: "delivery", // Record type: Delivery
      mileage: mileage || vehicle.current_mileage, // Mileage at delivery
      battery_level_percentage: battery_level_percentage ?? 100, // Battery % at delivery
      notes: notes || "Vehicle in normal condition, full battery, all documents provided.",
      confirmed_by_customer: !!customer_signature,
      customer_signature: customer_signature || null,
    });

    // 6. 🟢 UPDATE BOOKING & VEHICLE STATUS
    // Booking transitions to vehicle_delivered (Waiting for customer confirmation)
    booking.updateStatus("vehicle_delivered");
    await booking.save();

    // Vehicle transitions to rented status (so other processes can't use this vehicle)
    vehicle.status = "rented";
    await vehicle.save();

    // Populate customer to get User ID
    await booking.populate("customer");
    if (booking.customer && booking.customer.user) {
      await sendNotification({
        recipientId: booking.customer.user,
        title: "Vehicle Handover Successful",
        message: `Vehicle ${vehicle.license_plate} has been handed over. Have a safe trip!`,
        type: "vehicle_handover",
        relatedId: newHandover._id,
        relatedModel: "VehicleHandover",
      });
    }

    res.status(201).json({
      success: true,
      message: "Delivery handover record created successfully! Trip has started.",
      data: {
        handover: newHandover,
        booking_status: booking.status,
        vehicle_status: vehicle.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/handovers/return
// @access Private (Staff only)
export const createReturnHandover = async (req, res) => {
  try {
    const {
      booking_id,
      return_mileage,
      battery_level_percentage,
      notes,
      penalty_amount,
      customer_signature,
    } = req.body;

    // 1. Verify Staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff)
      return res
        .status(403)
        .json({ message: "Only staff can create return handover records." });

    // 2. Find Booking
    const booking = await Booking.findById(booking_id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (booking.status !== "in_progress") {
      return res.status(400).json({
        message: `Booking is in status ${booking.status}. Only receive vehicle when status is in_progress.`,
      });
    }

    // 3. Find the rented vehicle
    const vehicle = await Vehicle.findById(booking.vehicle);
    if (!vehicle)
      return res
        .status(404)
        .json({ message: "Error: Vehicle data not found." });

    // 3.5. Check if return handover already exists (prevent duplicates)
    const existingReturn = await VehicleHandover.findOne({
      booking: booking._id,
      handover_type: "return",
    });
    if (existingReturn) {
      return res.status(400).json({
        message: "This booking already has a return handover record.",
      });
    }

    // 3.6. Validate return mileage
    if (return_mileage == null || return_mileage < 0) {
      return res.status(400).json({
        message: "Please enter a valid return mileage.",
      });
    }

    // (Optional) Find delivery handover to compare mileage
    const deliveryHandover = await VehicleHandover.findOne({
      booking: booking._id,
      handover_type: "delivery",
    });

    if (deliveryHandover && return_mileage < deliveryHandover.mileage) {
      return res.status(400).json({
        message: `Return mileage (${return_mileage}) cannot be less than delivery mileage (${deliveryHandover.mileage})!`,
      });
    }

    // 4. CREATE RETURN HANDOVER RECORD
    const newHandover = await VehicleHandover.create({
      booking: booking._id,
      vehicle: vehicle._id,
      staff: staff._id,
      handover_type: "return", // Record type: Return
      mileage: return_mileage,
      battery_level_percentage: battery_level_percentage,
      notes: notes || "Vehicle returned on time, normal condition.",
      confirmed_by_customer: !!customer_signature,
      customer_signature: customer_signature || null,
    });

    // 5. CALCULATE FINAL AMOUNT
    // Include penalty in total_amount so it reflects the absolute final cost
    const penalty = penalty_amount || 0;
    booking.total_amount += penalty;
    
    // final_amount = Current Total - Deposit paid
    const final_amount = booking.total_amount - booking.deposit_amount;

    // 6. UPDATE BOOKING & VEHICLE STATUS
    booking.actual_return_date = new Date(); // Record actual return time
    booking.final_amount = final_amount > 0 ? final_amount : 0; // Remaining amount customer needs to pay
    booking.updateStatus("vehicle_returned"); // Update status: Vehicle returned (Awaiting final payment)
    await booking.save();

    // Vehicle recovered to lot -> Available for next customer
    vehicle.status = "available";
    vehicle.current_mileage = return_mileage; // Update latest odometer for vehicle
    await vehicle.save();

    // Populate customer to get User ID
    await booking.populate("customer");
    if (booking.customer && booking.customer.user) {
      await sendNotification({
        recipientId: booking.customer.user,
        title: "Vehicle Returned Successfully",
        message: `Received vehicle ${vehicle.license_plate}. Please pay any remaining balance.`,
        type: "vehicle_return",
        relatedId: newHandover._id,
        relatedModel: "VehicleHandover",
      });
    }

    // 7. IF BOOKING HAS DRIVER -> RELEASE DRIVER
    if (booking.driver) {
      const driver = await Driver.findById(booking.driver);
      if (driver) {
        // Only switch to available if driver is currently busy
        // Avoid changing offline driver to available
        if (driver.status === "busy") {
          driver.status = "available";
        }
        driver.total_trips += 1;
        await driver.save();

        // Update assignment record to "completed" so it appears in Driver's Completed tab
        await DriverAssignment.findOneAndUpdate(
          { booking: booking._id, driver: driver._id, status: "accepted" },
          { status: "completed" }
        );
      }
    }

    res.status(201).json({
      success: true,
      message:
        "Vehicle returned successfully! Please guide the customer to pay the remaining balance.",
      data: {
        handover: newHandover,
        penalty_amount: penalty,
        final_amount_to_pay: booking.final_amount,
        booking_status: booking.status,
        vehicle_status: vehicle.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF: VIEW ALL HANDOVER RECORDS ====================
// @route GET /api/handovers
// @access Private (Staff)
export const getAllHandovers = async (req, res) => {
  try {
    const { handover_type, booking_id, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (handover_type) {
      if (!["delivery", "return"].includes(handover_type)) {
        return res.status(400).json({
          message: 'handover_type must be "delivery" or "return".',
        });
      }
      filter.handover_type = handover_type;
    }
    if (booking_id) filter.booking = booking_id;

    const handovers = await VehicleHandover.find(filter)
      .populate({
        path: "booking",
        select: "status rental_type start_date end_date total_amount",
        populate: {
          path: "customer",
          populate: { path: "user", select: "full_name phone" },
        },
      })
      .populate({
        path: "vehicle",
        select: "brand model license_plate",
      })
      .populate({
        path: "staff",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ handover_time: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await VehicleHandover.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: handovers.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: handovers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== VIEW HANDOVER DETAILS ====================
// @route GET /api/handovers/:id
// @access Private (Staff)
export const getHandoverById = async (req, res) => {
  try {
    const handover = await VehicleHandover.findById(req.params.id)
      .populate({
        path: "booking",
        populate: [
          {
            path: "customer",
            populate: { path: "user", select: "full_name phone email" },
          },
          {
            path: "driver",
            populate: { path: "user", select: "full_name phone" },
          },
        ],
      })
      .populate({
        path: "vehicle",
        select:
          "brand model license_plate year color daily_rate current_mileage",
        populate: { path: "vehicle_type" },
      })
      .populate({
        path: "staff",
        populate: { path: "user", select: "full_name" },
      });

    if (!handover) {
      return res
        .status(404)
        .json({ message: "Handover record not found." });
    }

    res.status(200).json({
      success: true,
      data: handover,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== VIEW HANDOVER BY BOOKING ====================
// @route GET /api/handovers/booking/:bookingId
// @access Private (Staff / Customer who owns the booking)
export const getHandoversByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find booking first to check permissions
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Check permissions: Staff can view any, Customer can only view their own bookings
    const staff = await Staff.findOne({ user: req.user._id });
    const customer = await Customer.findOne({ user: req.user._id });

    if (
      customer &&
      !staff &&
      booking.customer.toString() !== customer._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view handover records for this booking." });
    }

    const handovers = await VehicleHandover.find({ booking: bookingId })
      .populate({
        path: "vehicle",
        select: "brand model license_plate",
      })
      .populate({
        path: "staff",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ handover_time: 1 }); // Sort by time: delivery first, return after

    // Separate delivery and return for clarity
    const delivery =
      handovers.find((h) => h.handover_type === "delivery") || null;
    const returnHandover =
      handovers.find((h) => h.handover_type === "return") || null;

    res.status(200).json({
      success: true,
      data: {
        booking_id: bookingId,
        booking_status: booking.status,
        delivery,
        return: returnHandover,
        // If both exist → calculate km driven
        km_driven:
          delivery && returnHandover
            ? returnHandover.mileage - delivery.mileage
            : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== CUSTOMER: CONFIRM VEHICLE RECEIPT ====================
// @route PUT /api/handovers/:id/confirm-receipt
// @access Private (Customer who owns the booking)
export const confirmDeliveryReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOne({ user: req.user._id });

    if (!customer) {
      return res.status(403).json({
        message: "Only customers can confirm vehicle receipt.",
      });
    }

    const handover = await VehicleHandover.findById(id).populate("booking");

    if (!handover) {
      return res.status(404).json({ message: "Handover record not found." });
    }

    const booking = handover.booking;
    if (!booking) {
      return res.status(404).json({ message: "Related booking not found." });
    }

    if (booking.customer.toString() !== customer._id.toString()) {
      return res.status(403).json({
        message: "You do not have permission to confirm this record.",
      });
    }

    if (handover.confirmed_by_customer) {
      return res.status(200).json({
        success: true,
        message: `${handover.handover_type === "delivery" ? "Vehicle pickup" : "Vehicle return"} record has already been confirmed.`,
        data: handover,
      });
    }

    handover.confirmed_by_customer = true;
    handover.customer_signature = {
      confirmed_at: new Date(),
      channel: "customer_portal",
    };

    await handover.save();

    // If this is a delivery handover, officially transition booking to 'in_progress'
    if (handover.handover_type === "delivery") {
      booking.updateStatus("in_progress");
      await booking.save();
    }

    return res.status(200).json({
      success: true,
      message:
        handover.handover_type === "delivery"
          ? "Vehicle pickup confirmed successfully. Your trip has officially started!"
          : "Vehicle return confirmed successfully.",
      data: {
        handover,
        booking_status: booking.status
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
