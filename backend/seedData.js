import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User, Customer, Driver, Staff, Admin } from "./models/user.model.js";
import { Vehicle, VehicleType } from "./models/vehicle.model.js";
import {
  Booking,
  VehicleHandover,
  DriverAssignment,
  ExtensionRequest,
} from "./models/booking.model.js";
import { Payment } from "./models/finance.model.js";
import { Review } from "./models/interaction.model.js"; // Assuming this exports Review
import Notification from "./models/notification.model.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected for Seeding");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1);
  }
};

const randomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seedData = async () => {
  await connectDB();

  try {
    console.log("Cleaning up old data (keeping Vehicles & admin)...");

    // Don't delete Vehicles or VehicleTypes
    // Don't delete Admin user (we will find or create)

    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});
    await VehicleHandover.deleteMany({});
    await DriverAssignment.deleteMany({});
    await ExtensionRequest.deleteMany({});

    // We will delete Users who are NOT admins, to avoid clutter
    // First find admin users
    const admins = await Admin.find({}).populate("user");
    const adminUserIds = admins.filter((a) => a.user).map((a) => a.user._id);

    await Customer.deleteMany({});
    await Driver.deleteMany({});
    await Staff.deleteMany({});
    await User.deleteMany({ _id: { $nin: adminUserIds } });

    // Ensure Super Admin exists (logic from seedAdmin.js)
    const checkAdmin = await User.findOne({ email: "admin@luxedrive.com" });
    if (!checkAdmin) {
      console.log("Creating Super Admin...");
      const hashedAdminPwd = await bcrypt.hash("Password123!", 10);
      const adminUser = await User.create({
        email: "admin@luxedrive.com",
        phone: "0900000001",
        password_hash: hashedAdminPwd,
        full_name: "Super Admin",
        avatar_url: "https://i.pravatar.cc/150?img=62",
        is_active: true,
      });
      await Admin.create({ user: adminUser._id });
    }

    console.log("Fetching existing Vehicles...");
    const vehicles = await Vehicle.find({});
    if (vehicles.length === 0) {
      console.error("No vehicles found! Please seed vehicles first.");
      process.exit(1);
    }

    console.log("Creating Users (Customers, Staff, Drivers)...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("123456", salt);

    const users = [];
    const customers = [];
    const drivers = [];
    const staffMembers = [];

    // 20 Customers
    for (let i = 1; i <= 20; i++) {
      const user = await User.create({
        email: `customer${i}@example.com`,
        phone: `090000000${i}`,
        password_hash: passwordHash,
        full_name: `Customer User ${i}`,
        is_active: true,
      });
      const customer = await Customer.create({
        user: user._id,
        id_card: `00120000000${i}`,
        driver_license: i % 2 === 0 ? `DL000${i}` : null, // Some have license
        address: `Address ${i}, HCMC`,
        loyalty_points: randomInt(0, 500),
      });
      users.push(user);
      customers.push(customer);
    }

    // 10 Staff
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        email: `staff${i}@luxedrive.com`,
        phone: `091000000${i}`,
        password_hash: passwordHash,
        full_name: `Staff Member ${i}`,
        is_active: true,
      });
      const staff = await Staff.create({
        user: user._id,
        employee_id: `EMP00${i}`,
        department: "Operations",
        position: "Staff",
        hire_date: new Date(), // Added required field
      });
      users.push(user);
      staffMembers.push(staff);
    }

    // 10 Drivers
    // Note: Driver must be Customer first
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        email: `driver${i}@luxedrive.com`,
        phone: `092000000${i}`,
        password_hash: passwordHash,
        full_name: `Driver User ${i}`,
        is_active: true,
      });
      // Create Customer profile for Driver
      await Customer.create({
        user: user._id,
        id_card: `00130000000${i}`,
        driver_license: `DL_DRIVER_${i}`,
        address: `Driver Address ${i}, HCMC`,
      });

      // Create Driver profile
      const driver = await Driver.create({
        user: user._id,
        license_number: `DL_DRIVER_${i}`,
        license_type: "B2",
        license_expiry: new Date(2030, 1, 1),
        experience_years: randomInt(2, 10),
        status: "available",
      });
      users.push(user);
      drivers.push(driver);
    }

    console.log("Creating Bookings & Related Data...");
    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-03-18");

    for (let i = 0; i < 40; i++) {
      // Create 40 bookings to ensure coverage
      const customer = randomElement(customers);
      const vehicle = randomElement(vehicles);
      const staff = randomElement(staffMembers);

      const bookingStart = randomDate(startDate, endDate);
      const duration = randomInt(1, 5);
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setDate(bookingStart.getDate() + duration);

      const rentalType =
        customer.driver_license && Math.random() > 0.5
          ? "self_drive"
          : "with_driver";

      let totalAmount = vehicle.daily_rate * duration;
      if (rentalType === "with_driver") totalAmount += 500000 * duration;
      const depositAmount = totalAmount * 0.3;

      // Determine status based on date
      let status = "pending";
      const now = new Date();
      if (bookingEnd < now) {
        status = randomElement(["completed", "completed", "cancelled"]); // More likely completed
      } else if (bookingStart < now && bookingEnd > now) {
        status = "in_progress";
      } else {
        status = randomElement(["pending", "confirmed"]);
      }

      const booking = await Booking.create({
        customer: customer._id,
        vehicle: vehicle._id,
        managed_by: staff._id,
        rental_type: rentalType,
        start_date: bookingStart,
        end_date: bookingEnd,
        pickup_location: "Showroom Q1",
        return_location: "Showroom Q1",
        status: status,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        final_amount:
          status === "completed" ? totalAmount - depositAmount : undefined,
        actual_return_date: status === "completed" ? bookingEnd : undefined,
      });

      // 1. Payments
      if (status !== "pending" && status !== "cancelled") {
        // Deposit Paid
        await Payment.create({
          booking: booking._id,
          customer: customer._id,
          payment_type: "deposit",
          amount: depositAmount,
          payment_method: randomElement(["vnpay", "card", "cash"]),
          status: "completed",
          transaction_id: `TXN_DEP_${i}`,
          payment_date: new Date(bookingStart.getTime() - 86400000), // 1 day before
        });

        if (status === "completed") {
          // Final Payment
          await Payment.create({
            booking: booking._id,
            customer: customer._id,
            payment_type: "rental_fee",
            amount: totalAmount - depositAmount,
            payment_method: randomElement(["vnpay", "card", "cash"]),
            status: "completed",
            transaction_id: `TXN_FIN_${i}`,
            payment_date: bookingEnd,
          });

          // 2. Review
          await Review.create({
            booking: booking._id,
            customer: customer._id,
            vehicle: vehicle._id,
            review_type: "overall",
            rating: randomInt(3, 5),
            comment: "Great service!",
          });
        }
      }

      // 3. Driver Assignment
      if (rentalType === "with_driver" && status !== "cancelled") {
        const driver = randomElement(drivers);
        await DriverAssignment.create({
          booking: booking._id,
          driver: driver._id,
          assigned_by: staff._id,
          status: status === "pending" ? "pending" : "accepted",
        });
        booking.driver = driver._id;
        await booking.save();
      }

      // 4. Handovers
      if (
        [
          "in_progress",
          "vehicle_delivered",
          "vehicle_returned",
          "completed",
        ].includes(status)
      ) {
        // Delivery
        await VehicleHandover.create({
          booking: booking._id,
          vehicle: vehicle._id,
          staff: staff._id,
          handover_type: "delivery",
          handover_time: bookingStart,
          mileage: vehicle.current_mileage,
          battery_level_percentage: 100,
          confirmed_by_customer: true,
          notes: "Delivered OK",
        });
      }

      if (["vehicle_returned", "completed"].includes(status)) {
        // Return
        await VehicleHandover.create({
          booking: booking._id,
          vehicle: vehicle._id,
          staff: staff._id,
          handover_type: "return",
          handover_time: bookingEnd,
          mileage: vehicle.current_mileage + randomInt(50, 200),
          battery_level_percentage: 50,
          confirmed_by_customer: true,
          notes: "Returned OK",
        });
      }

      // 5. Notifications
      await Notification.create({
        recipient: customer.user,
        title: "Booking Update",
        message: `Your booking is ${status}`,
        type: "general",
        related_id: booking._id,
        related_model: "Booking",
        event_key: `booking_update_${booking._id}`, // Ensure uniqueness
      });
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
