import { Booking, DriverAssignment } from "../models/booking.model.js";
import { Driver, Staff } from "../models/user.model.js";

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
      const booking = await Booking.findById(assignment.booking);
      if (!booking || booking.status !== "confirmed") {
        // Đơn đã bị huỷ hoặc thay đổi trạng thái → rollback assignment
        assignment.status = "rejected";
        assignment.response_note =
          "Đơn đặt xe không còn ở trạng thái chờ phân công.";
        await assignment.save();
        return res.status(400).json({
          message: "Đơn đặt xe đã bị huỷ hoặc thay đổi, không thể nhận chuyến.",
        });
      }

      booking.driver = driver._id;
      await booking.save();

      driver.status = "busy";
      await driver.save();
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
