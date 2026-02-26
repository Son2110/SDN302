import { Booking } from "../models/booking.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { Customer } from "../models/user.model.js";
export const getAvailableVehicles = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    //1. validate
    if (!start_date || !end_date)
      return res
        .status(400)
        .json({ message: "Vui lòng nhập ngày bắt đầu và ngày kết thúc" });
    const checkIn = new Date(start_date);
    const checkOut = new Date(end_date);

    if (checkIn >= checkOut)
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu phải trước ngày kết thúc" });
    if (checkIn < new Date())
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu không được là ngày trong quá khứ" });

    //2. find busy car
    const busyBookings = await Booking.find({
      status: {
        $nin: ["cancelled", "completed", "deposit_lost", "vehicle_returned"],
      },
      $and: [{ start_date: { $lt: checkOut } }, { end_date: { $gt: checkIn } }],
    }).select("vehicle");

    const busyVehiclesIds = busyBookings.map((booking) => booking.vehicle);

    //3. find available car
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

    //1. infor customer
    const customer = await Customer.findOne({ user: req.user._id });
    if (!customer)
      return res
        .status(403)
        .json({ message: "Chỉ khách hàng mới có thể đặt xe" });

    if (rental_type === "self_drive" && !customer.driver_license) {
      return res.status(400).json({
        message:
          "Bạn chưa cập nhật Giấy phép lái xe. Vui lòng cập nhật trong Hồ sơ trước khi thuê xe tự lái!",
      });
    }

    //2. validate
    const checkIn = new Date(start_date);
    const checkOut = new Date(end_date);
    const now = new Date();

    if (checkIn >= checkOut)
      return res
        .status(400)
        .json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });
    if (checkIn < now)
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu không được là ngày trong quá khứ" });

    //3. double check (race condition)
    const overlappingBooking = await Booking.findOne({
      vehicle: vehicle_id,
      status: {
        $nin: ["cancelled", "completed", "deposit_lost", "vehicle_returned"],
      },
      $and: [{ start_date: { $lt: checkOut } }, { end_date: { $gt: checkIn } }],
    });

    if (overlappingBooking)
      return res.status(400).json({
        message: "Xe đã được khách khác đặt trong khoảng thời gian này",
      });

    //4. check status vehicle
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle || vehicle.status !== "available")
      return res
        .status(404)
        .json({ message: "Xe không tồn tại hoặc hiện không khả dụng" });

    //5. count money
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

    res.status(201).json({
      success: true,
      message:
        "Đặt xe thành công. Vui lòng thanh toán tiền cọc để xác nhận đơn.",
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
