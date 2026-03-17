import { Booking, DriverAssignment } from "../models/booking.model.js";
import { Driver, Staff } from "../models/user.model.js";
import { sendNotification } from "../utils/notificationSender.js";

export const assignDriverToBooking = async (req, res) => {
  try {
    const { booking_id, driver_id } = req.body;

    //1. validate staff
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res
        .status(403)
        .json({ message: "Only staff can perform this action" });
    }

    //2. check booking
    const booking = await Booking.findById(booking_id);
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.rental_type !== "with_driver")
      return res.status(400).json({
        message: "This booking is self-drive, no driver assignment needed.",
      });

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: `Only assign drivers to confirmed bookings. Current status: ${booking.status}`,
      });
    }

    const existingAssignment = await DriverAssignment.findOne({
      booking: booking_id,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingAssignment) {
      return res.status(400).json({
        message:
          "This booking has already been assigned to another driver (pending or accepted).",
      });
    }

    //3. check driver
    const driver = await Driver.findById(driver_id);
    if (!driver || driver.status !== "available") {
      return res
        .status(400)
        .json({ message: "Driver does not exist or is not available." });
    }

    //4. create assignment
    const newAssignment = await DriverAssignment.create({
      booking: booking._id,
      driver: driver._id,
      assigned_by: staff._id,
      status: "pending",
    });

    // Notify Driver
    await sendNotification({
      recipientId: driver.user,
      title: "New Job Assignment",
      message: `You have been assigned to booking #${booking._id
        .toString()
        .slice(-6)}. Please confirm`,
      type: "driver_assigned",
      relatedId: newAssignment._id,
      relatedModel: "DriverAssignment",
    });

    res.status(201).json({
      success: true,
      message: "Assignment request sent to driver. Waiting for confirmation.",
      data: newAssignment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const respondToAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { status, response_note } = req.body;

    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) {
      return res
        .status(403)
        .json({ message: "Only drivers can perform this action." });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid response status." });
    }

    const assignment = await DriverAssignment.findById(assignmentId);
    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu phân công này." });
    }

    if (assignment.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        message: "You do not have permission to respond to other people's requests.",
      });
    }

    if (assignment.status !== "pending") {
      return res.status(400).json({
        message: `This request has already been processed (Current status: ${assignment.status}).`,
      });
    }
    assignment.status = status;
    if (response_note) {
      assignment.response_note = response_note;
    }
    await assignment.save();

    if (status === "accepted") {
      const booking = await Booking.findById(assignment.booking).populate(
        "customer",
      );
      if (!booking || booking.status !== "confirmed") {
        // Đơn đã bị huỷ hoặc thay đổi trạng thái → rollback assignment
        assignment.status = "rejected";
        assignment.response_note =
          "Booking is no longer in pending assignment status.";
        await assignment.save();
        return res.status(400).json({
          message: "This booking has been cancelled or modified and cannot be accepted.",
        });
      }

      booking.driver = driver._id;
      await booking.save();

      driver.status = "busy";
      await driver.save();

      // Notify Customer: Driver Assigned
      if (booking.customer && booking.customer.user) {
        await sendNotification({
          recipientId: booking.customer.user,
          title: "Driver Accepted Trip",
          message: `The driver has been assigned to booking #${booking._id
            .toString()
            .slice(-6)}.`,
          type: "driver_assigned",
          relatedId: booking._id,
          relatedModel: "Booking",
        });
      }
    }

    // Notify all Staff about Driver's response
    const allStaff = await Staff.find();
    for (const staffMember of allStaff) {
      await sendNotification({
        recipientId: staffMember.user,
        title: status === "accepted" ? "Driver Accepted Trip" : "Driver Rejected Trip",
        message: `Driver ${driver.user.full_name || "just"} has ${status === "accepted" ? "accepted" : "rejected"} assignment for booking #${assignment.booking.toString().slice(-6)}.`,
        type: "driver_assigned",
        relatedId: assignment.booking,
        relatedModel: "Booking",
      });
    }

    res.status(200).json({
      success: true,
      message:
        status === "accepted"
          ? "Accepted trip successfully!"
          : "Rejected trip successfully.",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF: LẤY TẤT CẢ PHÂN CÔNG ====================
// @route GET /api/driver-assignment
// @access Private (Staff)
export const getAllAssignments = async (req, res) => {
  try {
    const { status, driver_id, booking_id } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (driver_id) filter.driver = driver_id;
    if (booking_id) filter.booking = booking_id;

    const assignments = await DriverAssignment.find(filter)
      .populate({
        path: "booking",
        populate: [
          { path: "vehicle" },
          {
            path: "customer",
            populate: { path: "user", select: "full_name phone email" },
          },
        ],
      })
      .populate({
        path: "driver",
        populate: { path: "user", select: "full_name phone" },
      })
      .populate({
        path: "assigned_by",
        populate: { path: "user", select: "full_name" },
      })
      .sort({ assigned_at: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== XEM CHI TIẾT 1 PHÂN CÔNG ====================
// @route GET /api/driver-assignment/:id
// @access Private (Staff, Driver)
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await DriverAssignment.findById(req.params.id)
      .populate({
        path: "booking",
        populate: [
          {
            path: "vehicle",
            populate: { path: "vehicle_type" },
          },
          {
            path: "customer",
            populate: {
              path: "user",
              select: "full_name phone email avatar_url",
            },
          },
        ],
      })
      .populate({
        path: "driver",
        populate: { path: "user", select: "full_name phone email" },
      })
      .populate({
        path: "assigned_by",
        populate: { path: "user", select: "full_name" },
      });

    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu phân công này." });
    }

    // Driver chỉ xem được assignment của mình
    const driver = await Driver.findOne({ user: req.user._id });
    if (driver && assignment.driver._id.toString() !== driver._id.toString()) {
      return res.status(403).json({
        message: "You do not have permission to view other people's assignments.",
      });
    }

    res.status(200).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF: CẬP NHẬT PHÂN CÔNG (ĐỔI TÀI XẾ) ====================
// @route PUT /api/driver-assignment/:id
// @access Private (Staff)
export const updateAssignment = async (req, res) => {
  try {
    const { driver_id } = req.body;

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        message: "Chỉ nhân viên mới có quyền thực hiện thao tác này.",
      });
    }

    const assignment = await DriverAssignment.findById(req.params.id);
    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu phân công này." });
    }

    // Chỉ cho phép cập nhật khi đang pending hoặc bị rejected
    if (assignment.status === "accepted") {
      return res.status(400).json({
        message:
          "Cannot modify assignment already accepted by driver. Cancel it first then create new.",
      });
    }

    if (driver_id) {
      const newDriver = await Driver.findById(driver_id);
      if (!newDriver || newDriver.status !== "available") {
        return res.status(400).json({
          message: "New driver does not exist or is not available.",
        });
      }
      assignment.driver = newDriver._id;
      assignment.status = "pending"; // Reset về pending khi đổi tài xế
      assignment.response_note = undefined;
      assignment.assigned_by = staff._id;
      assignment.assigned_at = Date.now();
    }

    await assignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment updated. New driver will receive request.",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== STAFF: HUỶ PHÂN CÔNG ====================
// @route DELETE /api/driver-assignment/:id
// @access Private (Staff)
export const deleteAssignment = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(403).json({
        message: "Chỉ nhân viên mới có quyền thực hiện thao tác này.",
      });
    }

    const assignment = await DriverAssignment.findById(req.params.id);
    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu phân công này." });
    }

    // Nếu tài xế đã nhận chuyến → phải rollback booking và driver status
    if (assignment.status === "accepted") {
      const booking = await Booking.findById(assignment.booking);
      if (booking) {
        booking.driver = null;
        await booking.save();
      }

      const driver = await Driver.findById(assignment.driver);
      if (driver && driver.status === "busy") {
        driver.status = "available";
        await driver.save();
      }
    }

    await DriverAssignment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Assignment cancelled successfully.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== TÀI XẾ XEM CHUYẾN CỦA MÌNH ====================
// @route GET /api/driver-assignment/my-assignments
// @access Private (Driver)
export const getMyAssignments = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });
    if (!driver) {
      return res
        .status(403)
        .json({ message: "Only drivers can view trip list." });
    }

    const { status } = req.query;

    const filter = { driver: driver._id };
    if (status) filter.status = status;

    const assignments = await DriverAssignment.find(filter)
      .populate({
        path: "booking",
        populate: [
          { path: "vehicle" },
          {
            path: "customer",
            populate: { path: "user", select: "full_name phone" },
          },
        ],
      })
      .sort({ assigned_at: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
