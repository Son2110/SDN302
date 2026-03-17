import { Booking } from "../models/booking.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Customer, Staff } from "../models/user.model.js";
import { Payment } from "../models/finance.model.js";
import { sendNotification } from "../utils/notificationSender.js";

export const getAvailableVehicles = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // If NO dates provided: Return ALL vehicles with status="available" (for Fleet page)
    if (!start_date || !end_date) {
      const allVehicles = await Vehicle.find({
        status: "available",
      }).populate("vehicle_type");

      return res.status(200).json({
        success: true,
        count: allVehicles.length,
        data: allVehicles,
      });
    }

    //1. validate dates
    const checkIn = new Date(start_date);
    const checkOut = new Date(end_date);
    const today = new Date();

    // Reset to start of day for date-only comparison
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    if (checkIn.getTime() >= checkOut.getTime())
      return res
        .status(400)
        .json({ message: "Start date must be before end date" });

    // Allow today and future dates only
    if (checkIn.getTime() < today.getTime())
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu không được là ngày trong quá khứ" });

    //2. find busy car (chỉ check booking đã confirmed - đã thanh toán cọc)
    const busyBookings = await Booking.find({
      status: {
        $in: ["confirmed", "in_progress"],
      },
      $and: [{ start_date: { $lt: checkOut } }, { end_date: { $gt: checkIn } }],
    }).select("vehicle");

    const busyVehiclesIds = busyBookings.map((booking) => booking.vehicle);

    //3. find available car (status="available" AND không có trong busyVehiclesIds)
    const availableVehicles = await Vehicle.find({
      status: "available",
      _id: { $nin: busyVehiclesIds },
    }).populate("vehicle_type");

    res.status(200).json({
      success: true,
      count: availableVehicles.length,
      data: availableVehicles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const {
      vehicle_id,
      start_date,
      end_date,
      rental_type,
      pickup_location,
      return_location,
    } = req.body;

    // Check if user is admin
    if (req.user.roles && req.user.roles.includes("admin")) {
      return res.status(403).json({
        message: "Admin accounts are not allowed to make bookings.",
      });
    }

    //1. infor customer
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Only customers can book vehicles" });

    if (rental_type === "self_drive" && !customer.driver_license) {
      return res.status(400).json({
        message:
          "You haven't updated your driver's license. Please update it in your Profile before renting a self-drive vehicle!",
      });
    }

    //2. validate
    const checkIn = new Date(start_date);
    const checkOut = new Date(end_date);
    const today = new Date();

    // Reset to start of day for date-only comparison
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);

    if (checkIn.getTime() >= checkOut.getTime())
      return res
        .status(400)
        .json({ message: "End date must be after start date" });

    // Allow today and future dates only
    if (checkIn.getTime() < today.getTime())
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu không được là ngày trong quá khứ" });

    //3. double check (race condition - chỉ check booking đã confirmed - chỉ check booking đã confirmed)
    const overlappingBooking = await Booking.findOne({
      vehicle: vehicle_id,
      status: {
        $in: ["confirmed", "in_progress"],
      },
      $and: [{ start_date: { $lt: checkOut } }, { end_date: { $gt: checkIn } }],
    });

    if (overlappingBooking)
      return res.status(400).json({
        message: "Vehicle is already booked by another customer for this period",
      });

    //4. check status vehicle
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle || vehicle.status !== "available")
      return res
        .status(404)
        .json({ message: "Vehicle does not exist or is currently unavailable" });

    //5. count money (billable days: 13-16 = 3 days, exclude last day for handover)
    const diffTime = Math.abs(checkOut - checkIn);
    const rentalDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const actualDays = rentalDay > 0 ? rentalDay : 1;

    let total_amount = actualDays * vehicle.daily_rate;

    if (rental_type === "with_driver") {
      const DRIVER_FEE_PER_DAY = 500000;
      total_amount += actualDays * DRIVER_FEE_PER_DAY;
    }

    //deposit
    const deposit_amount = total_amount * 0.3;

    //time checkIn (if > 3h => cancel)
    const max_checkin_time = new Date(checkIn.getTime() + 3 * 60 * 60 * 1000);

    //create booking
    const newBooking = await Booking.create({
      customer: customer._id,
      vehicle: vehicle._id,
      rental_type,
      start_date: checkIn,
      end_date: checkOut,
      max_checkin_time,
      pickup_location,
      return_location,
      total_amount,
      deposit_amount,
      status: "pending",
    });

    // Notify Customer
    await sendNotification({
      recipientId: customer.user,
      title: "Booking Successful",
      message: `Booking #${newBooking._id.toString().slice(-6)} has been created. Please pay the deposit to confirm.`,
      type: "booking_created",
      relatedId: newBooking._id,
      relatedModel: "Booking",
    });

    // Notify all Staff
    const allStaff = await Staff.find();
    for (const staffMember of allStaff) {
      await sendNotification({
        recipientId: staffMember.user,
        title: "New Booking Order",
        message: `The system just received a new booking #${newBooking._id.toString().slice(-6)}. Please check and support the customer.`,
        type: "booking_created",
        relatedId: newBooking._id,
        relatedModel: "Booking",
      });
    }

    res.status(201).json({
      success: true,
      message:
        "Booking successful. Please pay the deposit to confirm your order.",
      data: {
        booking_id: newBooking._id,
        total_amount: newBooking.total_amount,
        deposit_amount: newBooking.deposit_amount,
        status: newBooking.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== HUỶ ĐƠN ====================
// @route PUT /api/bookings/:id/cancel
// @access Private (Customer hoặc Staff)
export const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // Chỉ huỷ khi đơn đang pending hoặc confirmed
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        message: `Booking is in status "${booking.status}", cannot cancel.`,
      });
    }

    // Kiểm tra quyền: customer chỉ huỷ đơn của mình, staff huỷ bất kỳ
    const customer = await Customer.findOne({ user: req.user._id });
    const staff = await Staff.findOne({ user: req.user._id });

    if (customer) {
      if (booking.customer.toString() !== customer._id.toString()) {
        return res
          .status(403)
          .json({ message: "You do not have permission to cancel this booking." });
      }
    } else if (!staff) {
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action." });
    }

    const previousStatus = booking.status;

    // Nếu đơn đã confirmed (đã cọc) → tạo record hoàn tiền
    if (previousStatus === "confirmed") {
      await Payment.create({
        booking: booking._id,
        customer: booking.customer,
        payment_type: "refund",
        amount: booking.deposit_amount,
        payment_method: "cash",
        status: "completed",
        transaction_id: `REFUND_${Date.now()}`,
        processed_by: staff ? staff._id : null,
      });
    }

    booking.updateStatus("cancelled");
    await booking.save();

    // Notify all Staff if customer cancels
    if (customer) {
      const allStaff = await Staff.find();
      for (const staffMember of allStaff) {
        await sendNotification({
          recipientId: staffMember.user,
          title: "Đơn bị huỷ",
          message: `Khách hàng vừa huỷ đơn đặt xe #${booking._id.toString().slice(-6)}.`,
          type: "general",
          relatedId: booking._id,
          relatedModel: "Booking",
        });
      }
    }

    res.status(200).json({
      success: true,
      message:
        previousStatus === "confirmed"
          ? "Booking cancelled successfully. Deposit will be refunded."
          : "Booking cancelled successfully.",
      data: {
        booking_id: booking._id,
        booking_status: booking.status,
        refunded: previousStatus === "confirmed",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM ĐƠN CỦA TÔI (Customer) ====================
// @route GET /api/bookings/my-bookings
// @access Private (Customer)
export const getMyBookings = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Only customers can view their own bookings." });

    const { status, page = 1, limit = 10 } = req.query;

    const filter = { customer: customer._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("vehicle")
      .populate("driver")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM CHI TIẾT ĐƠN ====================
// @route GET /api/bookings/:id
// @access Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "vehicle",
        populate: { path: "vehicle_type" },
      })
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name email phone" },
      })
      .populate({
        path: "driver",
        populate: { path: "user", select: "full_name email phone" },
      });

    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // Customer chỉ xem đơn của mình
    const customer = await Customer.findOne({ user: req.user._id });
    const staff = await Staff.findOne({ user: req.user._id });

    if (
      customer &&
      booking.customer._id.toString() !== customer._id.toString() &&
      !staff
    ) {
      return res
        .status(403)
        .json({ message: "You do not have permission to view this booking." });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF CẬP NHẬT ĐƠN ====================
// @route PUT /api/bookings/:id
// @access Private (Staff)
export const updateBooking = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        message: "Only staff can perform this action.",
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // Chỉ cho sửa khi đơn pending hoặc confirmed
    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({
        message: `Booking is in status "${booking.status}", cannot edit.`,
      });
    }

    const {
      vehicle_id,
      start_date,
      end_date,
      pickup_location,
      return_location,
      rental_type,
    } = req.body;

    // Cập nhật ngày nếu có
    const checkIn = start_date ? new Date(start_date) : booking.start_date;
    const checkOut = end_date ? new Date(end_date) : booking.end_date;

    if (checkIn >= checkOut) {
      return res
        .status(400)
        .json({ message: "End date must be after start date." });
    }

    // Đổi xe nếu có
    let vehicle;
    if (vehicle_id && vehicle_id !== booking.vehicle.toString()) {
      // Check xe mới có available không
      vehicle = await Vehicle.findById(vehicle_id);
      if (!vehicle || vehicle.status !== "available") {
        return res
          .status(400)
          .json({ message: "New vehicle does not exist or is not available." });
      }

      // Check trùng lịch xe mới
      const overlapping = await Booking.findOne({
        _id: { $ne: booking._id },
        vehicle: vehicle_id,
        status: {
          $nin: ["cancelled", "completed", "deposit_lost", "vehicle_returned"],
        },
        $and: [
          { start_date: { $lt: checkOut } },
          { end_date: { $gt: checkIn } },
        ],
      });

      if (overlapping) {
        return res.status(400).json({
          message: "New vehicle is already booked for this period.",
        });
      }

      booking.vehicle = vehicle._id;
    } else {
      vehicle = await Vehicle.findById(booking.vehicle);

      // Check trùng lịch nếu đổi ngày
      if (start_date || end_date) {
        const overlapping = await Booking.findOne({
          _id: { $ne: booking._id },
          vehicle: booking.vehicle,
          status: {
            $nin: [
              "cancelled",
              "completed",
              "deposit_lost",
              "vehicle_returned",
            ],
          },
          $and: [
            { start_date: { $lt: checkOut } },
            { end_date: { $gt: checkIn } },
          ],
        });

        if (overlapping) {
          return res.status(400).json({
            message: "Vehicle already has an overlapping booking for the new dates.",
          });
        }
      }
    }

    // Cập nhật fields
    if (start_date) booking.start_date = checkIn;
    if (end_date) booking.end_date = checkOut;
    if (pickup_location) booking.pickup_location = pickup_location;
    if (return_location) booking.return_location = return_location;
    if (rental_type) booking.rental_type = rental_type;

    // Tính lại tiền
    const diffTime = Math.abs(booking.end_date - booking.start_date);
    const rentalDay = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const actualDays = rentalDay > 0 ? rentalDay : 1;

    let total_amount = actualDays * vehicle.daily_rate;
    if (booking.rental_type === "with_driver") {
      const DRIVER_FEE_PER_DAY = 500000;
      total_amount += actualDays * DRIVER_FEE_PER_DAY;
    }

    booking.total_amount = total_amount;
    booking.deposit_amount = total_amount * 0.3;
    booking.max_checkin_time = new Date(
      booking.start_date.getTime() + 3 * 60 * 60 * 1000,
    );
    booking.managed_by = staff._id;

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking updated successfully.",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF XOÁ ĐƠN ====================
// @route DELETE /api/bookings/:id
// @access Private (Staff)
export const deleteBooking = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        message: "Only staff can perform this action.",
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe." });

    // Chỉ cho xoá khi đơn đã cancelled hoặc đang pending
    if (!["pending", "cancelled"].includes(booking.status)) {
      return res.status(400).json({
        message: `Booking is in status "${booking.status}", cannot delete. Only pending or cancelled bookings can be deleted.`,
      });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF XEM TẤT CẢ ĐƠN ====================
// @route GET /api/bookings/all
// @access Private (Staff)
export const getAllBookings = async (req, res) => {
  try {
    const { status, rental_type, is_overdue, page = 1, limit = 20 } = req.query;

    const matchFilter = {};
    if (status) matchFilter.status = status;
    if (rental_type) matchFilter.rental_type = rental_type;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (is_overdue === "true") {
      matchFilter.end_date = { $lt: todayStart };
      // Nếu có status trên query thì nọ overwrite đoạn code này của is_overdue (nhưng is_overdue thường fetch với filter là All trạng thái)
      if (!status) {
        matchFilter.status = {
          $nin: ["completed", "vehicle_returned", "cancelled", "pending"],
        };
      }
    }

    const bookings = await Booking.find(matchFilter)
      .populate("vehicle")
      .populate({
        path: "customer",
        populate: { path: "user", select: "full_name email phone" },
      })
      .populate("driver")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Booking.countDocuments(matchFilter);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== LẤY CÁC NGÀY ĐÃ ĐƯỢC BOOK CỦA XE ====================
// @route GET /api/bookings/vehicle/:vehicleId/booked-dates
// @access Public
export const getVehicleBookedDates = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // ONLY return confirmed/in_progress bookings (đã thanh toán cọc)
    // Pending bookings chưa thanh toán nên không block calendar
    const bookings = await Booking.find({
      vehicle: vehicleId,
      status: {
        $in: ["confirmed", "in_progress"],
      },
    }).select("start_date end_date status");

    // Return array of date ranges
    const bookedRanges = bookings.map((booking) => ({
      start: booking.start_date,
      end: booking.end_date,
    }));

    res.status(200).json({
      success: true,
      count: bookedRanges.length,
      data: bookedRanges,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
