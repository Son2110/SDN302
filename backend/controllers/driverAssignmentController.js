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
        .json({ message: "Chỉ nhân viên mới có quyền thực hiện thao tác này" });
    }

    //2. check booking
    const booking = await Booking.findById(booking_id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe" });

    if (booking.rental_type !== "with_driver")
      return res.status(400).json({
        message: "Đơn này là khách tự lái, không cần phân công tài xế.",
      });

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        message: `Chỉ phân công tài xế cho đơn đã cọc. Trạng thái hiện tại: ${booking.status}`,
      });
    }

    const existingAssignment = await DriverAssignment.findOne({
      booking: booking_id,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingAssignment) {
      return res.status(400).json({
        message:
          "Đơn này đã được phân công cho một tài xế khác (đang chờ xác nhận hoặc đã nhận).",
      });
    }

    //3. check driver
    const driver = await Driver.findById(driver_id);
    if (!driver || driver.status !== "available") {
      return res
        .status(400)
        .json({ message: "Tài xế không tồn tại hoặc đang không sẵn sàng." });
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
      title: "Có chuyến xe mới",
      message: `Bạn được phân công cho đơn #${booking._id
        .toString()
        .slice(-6)}. Vui lòng xác nhận`,
      type: "driver_assigned",
      relatedId: newAssignment._id,
      relatedModel: "DriverAssignment",
    });

    res.status(201).json({
      success: true,
      message: "Đã gửi yêu cầu phân công đến tài xế. Đang chờ tài xế xác nhận.",
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
        .json({ message: "Chỉ tài xế mới có quyền thao tác." });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Trạng thái phản hồi không hợp lệ." });
    }

    const assignment = await DriverAssignment.findById(assignmentId);
    if (!assignment) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy yêu cầu phân công này." });
    }

    if (assignment.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền phản hồi yêu cầu của người khác.",
      });
    }

    if (assignment.status !== "pending") {
      return res.status(400).json({
        message: `Yêu cầu này đã được xử lý (Hiện tại: ${assignment.status}).`,
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
          "Đơn đặt xe không còn ở trạng thái chờ phân công.";
        await assignment.save();
        return res.status(400).json({
          message: "Đơn này đã bị huỷ hoặc thay đổi, không thể nhận.",
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
          title: "Tài xế đã nhận chuyến",
          message: `Tài xế đã được phân công cho đơn #${booking._id
            .toString()
            .slice(-6)}.`,
          type: "driver_assigned",
          relatedId: booking._id,
          relatedModel: "Booking",
        });
      }
    }

    res.status(200).json({
      success: true,
      message:
        status === "accepted"
          ? "Nhận chuyến thành công!"
          : "Đã từ chối chuyến đi.",
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
        message: "Bạn không có quyền xem phân công của người khác.",
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
          "Không thể sửa phân công đã được tài xế nhận. Hãy huỷ trước rồi tạo mới.",
      });
    }

    if (driver_id) {
      const newDriver = await Driver.findById(driver_id);
      if (!newDriver || newDriver.status !== "available") {
        return res.status(400).json({
          message: "Tài xế mới không tồn tại hoặc đang không sẵn sàng.",
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
      message: "Đã cập nhật phân công. Tài xế mới sẽ nhận yêu cầu.",
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
      message: "Đã huỷ phân công thành công.",
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
        .json({ message: "Chỉ tài xế mới xem được danh sách chuyến." });
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
