import { Booking, ExtensionRequest } from "../models/booking.model.js";
import { Customer, Staff } from "../models/user.model.js";
import { sendNotification } from "../utils/notificationSender.js";

// @route POST /api/extensions/request
// @access Private (Customer only)
export const requestExtension = async (req, res) => {
  try {
    const { booking_id, new_end_date } = req.body;

    // 1. Authenticate Customer
    if (req.user.roles && (req.user.roles.includes("admin") || req.user.roles.includes("staff"))) {
      const roleName = req.user.roles.includes("admin") ? "Admin" : "Staff";
      return res.status(403).json({
        message: `${roleName} accounts are not allowed to request extensions.`,
      });
    }

    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Only customers can request extensions." });

    // 2. Find booking
    const booking = await Booking.findById(booking_id).populate("vehicle");
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    // Ensure this booking belongs to the logged-in customer
    if (booking.customer.toString() !== customer._id.toString()) {
      return res
        .status(403)
        .json({ message: "You don't have permission to modify this booking." });
    }

    // Only allow extension when vehicle is rented or about to be picked up
    if (!["confirmed", "in_progress"].includes(booking.status)) {
      return res.status(400).json({
        message: `Booking is in ${booking.status} status, cannot extend.`,
      });
    }

    // 3. Validate new time
    const currentEndDate = new Date(booking.end_date);
    const requestedEndDate = new Date(new_end_date);

    if (requestedEndDate <= currentEndDate) {
      return res
        .status(400)
        .json({ message: "Extension date must be after current return date." });
    }

    // Calculate number of extension days (Round up)
    const diffTime = Math.abs(requestedEndDate - currentEndDate);
    const daysExtended = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 4. Calculate additional fee:
    // - Extension before rental (status = confirmed) => normal daily rate
    // - Extension during actual rental period (status = in_progress) => +10% surcharge
    const dailyRate = booking.vehicle.daily_rate;
    const isDuringRental = booking.status === "in_progress";
    const extensionDailyRate = isDuringRental ? dailyRate * 1.1 : dailyRate;
    let additionalAmount = daysExtended * extensionDailyRate;

    if (booking.rental_type === "with_driver") {
      const DRIVER_FEE_PER_DAY = 500000; // Can be fetched from Config DB
      additionalAmount += daysExtended * DRIVER_FEE_PER_DAY;
    }

    // 5. CHECK FOR CONFLICTS (CRITICAL STEP)
    // Is anyone else booking this vehicle from the current return date to the new extension date?
    const conflictingBooking = await Booking.findOne({
      _id: { $ne: booking._id }, // Exclude the current booking
      vehicle: booking.vehicle._id,
      status: {
        $nin: ["cancelled", "completed", "deposit_lost", "vehicle_returned"],
      },
      $and: [
        { start_date: { $lt: requestedEndDate } }, // Someone else pickups < When customer intends to return (new)
        { end_date: { $gt: currentEndDate } }, // Someone else returns > When customer intended to return (old)
      ],
    });

    const hasConflict = !!conflictingBooking;

    // IF CONFLICT EXISTS, AUTOMATICALLY REJECT IMMEDIATELY
    if (hasConflict) {
      const extensionRequest = await ExtensionRequest.create({
        booking: booking._id,
        customer: customer._id,
        original_end_date: currentEndDate,
        new_end_date: requestedEndDate,
        days_extended: daysExtended,
        has_conflict: true,
        additional_amount: additionalAmount,
        status: "rejected", // Auto-reject when conflict exists
        reject_reason: "Vehicle has already been booked by another customer during the extension period.",
      });

      return res.status(200).json({
        success: false,
        message:
          "Extension request rejected as vehicle has already been booked during this period.",
        data: extensionRequest,
      });
    }

    // 6. CREATE EXTENSION REQUEST RECORD (No conflict, send to Staff for approval)
    const extensionRequest = await ExtensionRequest.create({
      booking: booking._id,
      customer: customer._id,
      original_end_date: currentEndDate,
      new_end_date: requestedEndDate,
      days_extended: daysExtended,
      has_conflict: false,
      additional_amount: additionalAmount,
      status: "pending", // Waiting for Staff approval
    });

    // Notify Customer about pending request
    await sendNotification({
      recipientId: customer.user,
      title: "Extension Request",
      message: `Your request to extend until ${new Date(new_end_date).toLocaleDateString()} is pending approval.`,
      type: "extension_status",
      relatedId: extensionRequest._id,
      relatedModel: "ExtensionRequest",
    });

    // Notify all Staff
    const allStaff = await Staff.find();
    for (const staffMember of allStaff) {
      await sendNotification({
        recipientId: staffMember.user,
        title: "New Extension Request",
        message: `Customer has requested an extension for booking #${booking._id.toString().slice(-6)}. Please review and approve.`,
        type: "extension_status",
        relatedId: extensionRequest._id,
        relatedModel: "ExtensionRequest",
      });
    }

    res.status(201).json({
      success: true,
      message: "Extension request sent. Please wait for staff confirmation.",
      data: extensionRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/extensions/:id/approve
// @access Private (Staff/Admin only)
export const approveExtension = async (req, res) => {
  try {
    const extensionId = req.params.id;

    // 1. Authenticate Staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res
        .status(403)
        .json({ message: "Only staff members have permission to approve extensions." });
    }

    // 2. Find extension request
    const extensionRequest = await ExtensionRequest.findById(extensionId);
    if (!extensionRequest) {
      return res
        .status(404)
        .json({ message: "Extension request not found." });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        message: `This request has already been processed (Status: ${extensionRequest.status}).`,
      });
    }

    // 3. Find original Booking
    const booking = await Booking.findById(extensionRequest.booking)
      .populate("customer")
      .populate("vehicle");
    if (!booking) {
      return res
        .status(404)
        .json({ message: "Original booking not found." });
    }

    // 3.5. Check if booking is still valid for extension
    if (!["confirmed", "in_progress"].includes(booking.status)) {
      return res.status(400).json({
        message: `Booking is in "${booking.status}" status, cannot approve extension.`,
      });
    }

    // 4. UPDATE ORIGINAL BOOKING (CONTRACT)
    // Extend return time
    booking.end_date = extensionRequest.new_end_date;
    // Add additional rental fee to total amount (Customer will pay at end of trip)
    booking.total_amount += extensionRequest.additional_amount;

    await booking.save();

    // 5. UPDATE EXTENSION REQUEST STATUS
    extensionRequest.status = "approved";
    extensionRequest.processed_by = staff._id; // Keep track of approving staff
    // Note: updatedAt field will automatically be changed to 'processed_at' if configured in schema
    await extensionRequest.save();

    // Notify Customer: Approved
    if (booking.customer && booking.customer.user) {
      await sendNotification({
        recipientId: booking.customer.user,
        title: "Extension Successful",
        message: `The extension request for vehicle ${booking.vehicle?.license_plate || ""
          } until ${new Date(extensionRequest.new_end_date).toLocaleDateString()} has been approved.`,
        type: "extension_status",
        relatedId: extensionRequest._id,
        relatedModel: "ExtensionRequest",
      });
    }

    res.status(200).json({
      success: true,
      message: "Extension approved successfully! Contract has been updated.",
      data: {
        extension_status: extensionRequest.status,
        new_end_date: booking.end_date,
        new_total_amount: booking.total_amount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/extensions/:id/reject
// @access Private (Staff only)
export const rejectExtension = async (req, res) => {
  try {
    const extensionId = req.params.id;
    const { reject_reason } = req.body;

    // 1. Authenticate Staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res
        .status(403)
        .json({ message: "Only staff members have permission to reject extensions." });
    }

    // 2. Find extension request
    const extensionRequest = await ExtensionRequest.findById(extensionId);
    if (!extensionRequest) {
      return res
        .status(404)
        .json({ message: "Extension request not found." });
    }

    if (extensionRequest.status !== "pending") {
      return res.status(400).json({
        message: `This request has already been processed (Status: ${extensionRequest.status}).`,
      });
    }

    // 3. Update status
    extensionRequest.status = "rejected";
    extensionRequest.processed_by = staff._id;
    if (reject_reason) {
      extensionRequest.reject_reason = reject_reason;
    }
    await extensionRequest.save();

    // 4. Notify Customer
    const booking = await Booking.findById(extensionRequest.booking)
      .populate({ path: "customer", populate: { path: "user" } })
      .populate("vehicle");

    if (booking?.customer?.user) {
      await sendNotification({
        recipientId: booking.customer.user._id || booking.customer.user,
        title: "Extension Rejected",
        message: `The extension request for vehicle ${booking.vehicle?.license_plate || ""
          } was rejected. Reason: ${reject_reason || "Not specified"}`,
        type: "extension_status",
        relatedId: extensionRequest._id,
        relatedModel: "ExtensionRequest",
      });
    }

    res.status(200).json({
      success: true,
      message: "Extension request rejected.",
      data: {
        extension_status: extensionRequest.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF: VIEW ALL EXTENSION REQUESTS ====================
// @route GET /api/extensions
// @access Private (Staff)
export const getAllExtensions = async (req, res) => {
  try {
    const { status, booking_id, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
      if (
        !["pending", "approved", "rejected", "alternative_offered"].includes(
          status,
        )
      ) {
        return res.status(400).json({
          message:
            "invalid status. Accepted: pending, approved, rejected, alternative_offered.",
        });
      }
      filter.status = status;
    }
    if (booking_id) filter.booking = booking_id;

    const extensions = await ExtensionRequest.find(filter)
      .populate({
        path: "booking",
        select: "status rental_type start_date end_date total_amount vehicle",
        populate: {
          path: "vehicle",
          select: "brand model license_plate",
        },
      })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name phone email" },
      })
      .populate({
        path: "processed_by",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ requested_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ExtensionRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: extensions.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: extensions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== VIEW EXTENSION REQUEST DETAILS ====================
// @route GET /api/extensions/:id
// @access Private (Staff / Customer chủ yêu cầu)
export const getExtensionById = async (req, res) => {
  try {
    const extension = await ExtensionRequest.findById(req.params.id)
      .populate({
        path: "booking",
        populate: [
          {
            path: "vehicle",
            select: "brand model license_plate daily_rate",
            populate: { path: "vehicle_type" },
          },
          {
            path: "customer",
            populate: { path: "user", select: "full_name phone email" },
          },
        ],
      })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name phone email" },
      })
      .populate({
        path: "processed_by",
        populate: { path: "user", select: "full_name" },
      })
      .populate({
        path: "alternative_vehicle",
        select: "brand model license_plate daily_rate",
      });

    if (!extension) {
      return res
        .status(404)
        .json({ message: "Extension request not found." });
    }

    // Customer can only view their own requests
    const customer = await Customer.findOne({ user: req.user._id });
    const staff = await Staff.findOne({ user: req.user._id });

    if (
      customer &&
      !staff &&
      extension.customer._id.toString() !== customer._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You don't have permission to view this extension request." });
    }

    res.status(200).json({
      success: true,
      data: extension,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== CUSTOMER: VIEW OWN EXTENSION REQUESTS ====================
// @route GET /api/extensions/my-requests
// @access Private (Customer)
export const getMyExtensions = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer) {
      return res
        .status(403)
        .json({ message: "Only customers can view extension requests." });
    }

    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customer: customer._id };
    if (status) filter.status = status;

    const extensions = await ExtensionRequest.find(filter)
      .populate({
        path: "booking",
        select: "status rental_type start_date end_date total_amount",
        populate: {
          path: "vehicle",
          select: "brand model license_plate",
        },
      })
      .populate({
        path: "processed_by",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ requested_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ExtensionRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: extensions.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: extensions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
