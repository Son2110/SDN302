import { Booking } from "../models/booking.model.js";
import { Payment } from "../models/finance.model.js";
import { Customer } from "../models/user.model.js";

export const processDepositPayment = async (req, res) => {
  try {
    const { booking_id, payment_method, transaction_id } = req.body;

    //1. validate payment
    const validMethods = ["cash", "card", "momo", "zalopay", "vnpay"];
    if (!validMethods.includes(payment_method))
      return res
        .status(400)
        .json({ message: "Phương thức thanh toán không hợp lệ" });

    //2. check auth
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Chỉ khách hàng mới có thể thanh toán" });

    //3. find booking
    const booking = await Booking.findById(booking_id);
    if (!booking)
      return res.status(404).json({ message: "Không tìm thấy đơn đặt xe" });

    //4. check customer
    if (booking.customer.toString() !== customer._id.toString())
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thanh toán cho đơn này" });

    //5. check status booking
    if (booking.status !== "pending")
      return res
        .status(400)
        .json({
          message: `Đơn đang ở trạng thái "${booking.status}", không thể thanh toán`,
        });

    //6. Save payment
    const newPayment = await Payment.create({
      booking: booking._id,
      customer: customer._id,
      payment_type: "deposit",
      amount: booking.deposit_amount,
      payment_method: payment_method,
      status: "completed",
      transaction_id: transaction_id,
      processed_by: null,
    });

    //7. Update booking status
    booking.status = "confirmed";
    await booking.save();

    //8 response
    res.status(200).json({
      success: true,
      message: "Thanh toán cọc thành công. Đơn đặt xe đã được xác nhận",
      data: {
        payment_id: newPayment._id,
        amount_paid: newPayment.amount,
        payment_date: newPayment.payment_date,
        booking_status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
