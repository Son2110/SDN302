import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Admin } from "./models/user.model.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const existingAdminUser = await User.findOne({
      email: "admin@luxedrive.com",
    });

    if (existingAdminUser) {
      console.log("⚠️  Admin user đã tồn tại, bỏ qua.");
    } else {
      const hashedPassword = await bcrypt.hash("Password123!", 10);

      const adminUser = await User.create({
        email: "admin@luxedrive.com",
        phone: "0900000001",
        password_hash: hashedPassword,
        full_name: "Super Admin",
        avatar_url: "https://i.pravatar.cc/150?img=62",
      });

      await Admin.create({ user: adminUser._id });

      console.log("✅ Tạo Admin thành công:");
      console.log("   Email   : admin@luxedrive.com");
      console.log("   Password: Password123!");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed thất bại:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
