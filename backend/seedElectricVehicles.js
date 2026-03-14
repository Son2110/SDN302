import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Customer, Driver, Staff } from "./models/user.model.js";
import {
  VehicleType,
  Vehicle,
  ChargingStation,
} from "./models/vehicle.model.js";
import {
  Booking,
  VehicleHandover,
  DriverAssignment,
  ExtensionRequest,
} from "./models/booking.model.js";
import {
  Payment,
  Promotion,
  PromotionUsage,
  FinancialReport,
  RevenueDetail,
} from "./models/finance.model.js";
import { Review, Notification } from "./models/interaction.model.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // ============================================
    // XÓA DỮ LIỆU CŨ
    // ============================================
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Driver.deleteMany({});
    await Staff.deleteMany({});
    await VehicleType.deleteMany({});
    await Vehicle.deleteMany({});
    await ChargingStation.deleteMany({});
    await Booking.deleteMany({});
    await VehicleHandover.deleteMany({});
    await DriverAssignment.deleteMany({});
    await ExtensionRequest.deleteMany({});
    await Payment.deleteMany({});
    await Promotion.deleteMany({});
    await PromotionUsage.deleteMany({});
    await FinancialReport.deleteMany({});
    await RevenueDetail.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});
    console.log("🗑️  Cleared old data");

    // ============================================
    // PASSWORD CHUNG: password123
    // ============================================
    const PASSWORD = "password123";
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    console.log(`🔑 Password chung cho tất cả account: ${PASSWORD}`);

    // ============================================
    // 1. USERS (10 users)
    // ============================================
    const users = await User.insertMany([
      // CUSTOMERS (5)
      {
        email: "customer1@ecorides.com",
        phone: "0901234567",
        password_hash: hashedPassword,
        full_name: "Nguyễn Văn An",
        avatar_url:
          "https://i.pinimg.com/736x/8b/16/7a/8b167af653c2399dd93b952a48740620.jpg",
      },
      {
        email: "customer2@ecorides.com",
        phone: "0901234568",
        password_hash: hashedPassword,
        full_name: "Trần Thị Bình",
        avatar_url:
          "https://i.pinimg.com/736x/07/33/ba/0733ba760b29378474dea0fdbcb97107.jpg",
      },
      {
        email: "customer3@ecorides.com",
        phone: "0901234569",
        password_hash: hashedPassword,
        full_name: "Lê Minh Châu",
        avatar_url:
          "https://i.pinimg.com/736x/de/0f/3d/de0f3d06d2c6dbf819a64c1ab053b5b6.jpg",
      },
      {
        email: "customer4@ecorides.com",
        phone: "0901234570",
        password_hash: hashedPassword,
        full_name: "Phạm Hoàng Dũng",
        avatar_url:
          "https://i.pinimg.com/736x/1c/c5/35/1cc535901a6bd1ddf4839ea15db05a7c.jpg",
      },
      {
        email: "customer5@ecorides.com",
        phone: "0901234571",
        password_hash: hashedPassword,
        full_name: "Võ Thị Em",
        avatar_url:
          "https://i.pinimg.com/736x/a8/57/00/a85700f3c614f6e2a36d7a8e35f0a5fd.jpg",
      },
      // DRIVERS (3)
      {
        email: "driver1@ecorides.com",
        phone: "0912345678",
        password_hash: hashedPassword,
        full_name: "Đỗ Văn Lái",
        avatar_url:
          "https://i.pinimg.com/736x/5f/ed/29/5fed29f89f1760c56c7c30f4642c7873.jpg",
      },
      {
        email: "driver2@ecorides.com",
        phone: "0912345679",
        password_hash: hashedPassword,
        full_name: "Hoàng Minh Khải",
        avatar_url:
          "https://i.pinimg.com/736x/02/e3/ab/02e3abbc1bb5053e1ce58a4be0cbf67c.jpg",
      },
      {
        email: "driver3@ecorides.com",
        phone: "0912345680",
        password_hash: hashedPassword,
        full_name: "Bùi Thành Long",
        avatar_url:
          "https://i.pinimg.com/736x/bf/bc/27/bfbc27685d914cdff9d58ce9d8f8c89c.jpg",
      },
      // STAFF (2)
      {
        email: "staff1@ecorides.com",
        phone: "0923456789",
        password_hash: hashedPassword,
        full_name: "Ngô Thị Mai",
        avatar_url:
          "https://i.pinimg.com/736x/41/fa/c3/41fac352a5cc0bb2c6f0e98b72c69490.jpg",
      },
      {
        email: "staff2@ecorides.com",
        phone: "0923456790",
        password_hash: hashedPassword,
        full_name: "Vũ Quốc Nam",
        avatar_url:
          "https://i.pinimg.com/736x/d3/7a/f9/d37af99c5b9c5719b7ba4a49b63d6975.jpg",
      },
    ]);
    console.log("✅ Created 10 Users");

    // ============================================
    // 2. CUSTOMERS (5)
    // ============================================
    const customers = await Customer.insertMany([
      {
        user: users[0]._id,
        id_card: "001099001234",
        driver_license: "B2-123456789",
        date_of_birth: new Date("1995-03-15"),
        address: "123 Lê Lợi, Quận 1, TP.HCM",
        rating: 4.8,
        total_bookings: 5,
        total_spent: 12500000,
        loyalty_points: 125,
      },
      {
        user: users[1]._id,
        id_card: "001099002345",
        driver_license: "B2-234567890",
        date_of_birth: new Date("1992-07-22"),
        address: "456 Nguyễn Huệ, Quận 1, TP.HCM",
        rating: 4.5,
        total_bookings: 3,
        total_spent: 8500000,
        loyalty_points: 85,
      },
      {
        user: users[2]._id,
        id_card: "001099003456",
        driver_license: "B2-345678901",
        date_of_birth: new Date("1998-11-10"),
        address: "789 Hai Bà Trưng, Quận 3, TP.HCM",
        rating: 5.0,
        total_bookings: 8,
        total_spent: 18000000,
        loyalty_points: 180,
      },
      {
        user: users[3]._id,
        id_card: "001099004567",
        driver_license: "B2-456789012",
        date_of_birth: new Date("1990-05-05"),
        address: "321 Trần Hưng Đạo, Quận 5, TP.HCM",
        rating: 4.2,
        total_bookings: 2,
        total_spent: 5000000,
        loyalty_points: 50,
      },
      {
        user: users[4]._id,
        id_card: "001099005678",
        driver_license: null, // Không có bằng lái - chỉ thuê xe có tài xế
        date_of_birth: new Date("2000-09-18"),
        address: "654 Võ Văn Tần, Quận 3, TP.HCM",
        rating: 4.7,
        total_bookings: 4,
        total_spent: 9500000,
        loyalty_points: 95,
      },
    ]);
    console.log("✅ Created 5 Customers");

    // ============================================
    // 3. DRIVERS (3)
    // ============================================
    const drivers = await Driver.insertMany([
      {
        user: users[5]._id,
        license_number: "B2-DRV001",
        license_type: "B2",
        license_expiry: new Date("2028-12-31"),
        experience_years: 8,
        rating: 4.9,
        total_trips: 156,
        status: "available",
      },
      {
        user: users[6]._id,
        license_number: "C-DRV002",
        license_type: "C",
        license_expiry: new Date("2027-08-15"),
        experience_years: 5,
        rating: 4.7,
        total_trips: 98,
        status: "available",
      },
      {
        user: users[7]._id,
        license_number: "B2-DRV003",
        license_type: "B2",
        license_expiry: new Date("2029-03-20"),
        experience_years: 10,
        rating: 5.0,
        total_trips: 234,
        status: "busy",
      },
    ]);
    console.log("✅ Created 3 Drivers");

    // ============================================
    // 4. STAFF (2)
    // ============================================
    const staff = await Staff.insertMany([
      {
        user: users[8]._id,
        employee_id: "EMP001",
        department: "Operations",
        position: "Booking Manager",
        hire_date: new Date("2023-01-15"),
      },
      {
        user: users[9]._id,
        employee_id: "EMP002",
        department: "Customer Service",
        position: "Customer Support",
        hire_date: new Date("2023-06-01"),
      },
    ]);
    console.log("✅ Created 2 Staff");

    // ============================================
    // 5. VEHICLE TYPES (5 loại xe VinFast - THÔNG SỐ THẬT)
    // ============================================
    const vehicleTypes = await VehicleType.insertMany([
      {
        type_name: "VinFast VF 5 Plus - SUV Điện Mini",
        category: "sedan",
        seat_capacity: 5,
        transmission: "auto",
        fuel_type: "electric",
        battery_capacity_kwh: 37.2,
        base_price_per_day: 900000, // Giá thuê ~900k/ngày
        charging_cost_per_kwh: 3500,
        image_url:
          "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw15aebeed/reserves/VF5/2025/10.webp",
      },
      {
        type_name: "VinFast VF e34 - SUV Điện Compact",
        category: "suv",
        seat_capacity: 5,
        transmission: "auto",
        fuel_type: "electric",
        battery_capacity_kwh: 42,
        base_price_per_day: 1200000, // Giá thuê ~1.2tr/ngày
        charging_cost_per_kwh: 3500,
        image_url:
          "https://autopro8.mediacdn.vn/2021/8/25/autopro-vinfast-vf-e34-da2-16298276092781253989751.jpg",
      },
      {
        type_name: "VinFast VF 6 - SUV Điện Cỡ Nhỏ",
        category: "suv",
        seat_capacity: 5,
        transmission: "auto",
        fuel_type: "electric",
        battery_capacity_kwh: 59.6,
        base_price_per_day: 1500000, // Giá thuê ~1.5tr/ngày
        charging_cost_per_kwh: 3500,
        image_url:
          "https://i.pinimg.com/originals/75/d4/67/75d46742218b198613dcddad1de21a34.jpg",
      },
      {
        type_name: "VinFast VF 8 - SUV Điện 5 Chỗ Cao Cấp",
        category: "suv",
        seat_capacity: 5,
        transmission: "auto",
        fuel_type: "electric",
        battery_capacity_kwh: 87.7,
        base_price_per_day: 2200000, // Giá thuê ~2.2tr/ngày
        charging_cost_per_kwh: 3500,
        image_url:
          "https://cdn-img.thethao247.vn/storage/files/trangquynh/2023/09/15/suv-dien-cung-phan-khuc-vinfast-vf8-bo-sung-them-ban-moi-gia-quy-doi-du-kien-chua-den-1-ty-dong-327180.jpg",
      },
      {
        type_name: "VinFast VF 9 - SUV Điện Hạng Sang 7 Chỗ",
        category: "luxury",
        seat_capacity: 7,
        transmission: "auto",
        fuel_type: "electric",
        battery_capacity_kwh: 123,
        base_price_per_day: 3500000, // Giá thuê ~3.5tr/ngày
        charging_cost_per_kwh: 3500,
        image_url:
          "https://static-cms-prod.vinfastauto.com/Vinfast-vf-9-suv-dien-hang-sang-cua-nguoi-viet_16538909531.jpg",
      },
    ]);
    console.log("✅ Created 5 VinFast Vehicle Types");

    // ============================================
    // 6. VEHICLES (20 xe VinFast)
    // ============================================
    const vehicles = await Vehicle.insertMany([
      // VinFast VF 5 Plus (4 xe)
      {
        vehicle_type: vehicleTypes[0]._id,
        license_plate: "51A-11111",
        brand: "VinFast",
        model: "VF 5 Plus",
        year: 2024,
        color: "Đỏ Ruby",
        status: "available",
        daily_rate: 900000,
        is_electric: true,
        current_mileage: 3200,
        image_urls: [
          "https://static-cms-prod.vinfastauto.com/Bang-mau-VinFast-VF-5-Plus-Crimson-Red_16711937311.jpg",
        ],
      },
      {
        vehicle_type: vehicleTypes[0]._id,
        license_plate: "51A-22222",
        brand: "VinFast",
        model: "VF 5 Plus",
        year: 2024,
        color: "Trắng Ngọc Trai",
        status: "available",
        daily_rate: 900000,
        is_electric: true,
        current_mileage: 5800,
        image_urls: [
          "https://tse4.mm.bing.net/th/id/OIP.HfsMO0F7dt0J5FuCthPqXwHaDm?rs=1&pid=ImgDetMain&o=7&rm=3",
        ],
      },
      {
        vehicle_type: vehicleTypes[0]._id,
        license_plate: "51A-33333",
        brand: "VinFast",
        model: "VF 5 Plus",
        year: 2024,
        color: "Xanh Dương",
        status: "rented",
        daily_rate: 900000,
        is_electric: true,
        current_mileage: 4100,
        image_urls: [
          "https://tse2.mm.bing.net/th/id/OIP.7-jsnFe-03ZuBkhNWSvkfQHaII?rs=1&pid=ImgDetMain&o=7&rm=3",
        ],
      },
      {
        vehicle_type: vehicleTypes[0]._id,
        license_plate: "51A-44444",
        brand: "VinFast",
        model: "VF 5 Plus",
        year: 2024,
        color: "Đen Tuyền",
        status: "available",
        daily_rate: 900000,
        is_electric: true,
        current_mileage: 2900,
        image_urls: [
          "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw15aebeed/reserves/VF5/2025/10.webp",
        ],
      },

      // VinFast VF e34 (4 xe)
      {
        vehicle_type: vehicleTypes[1]._id,
        license_plate: "51B-11111",
        brand: "VinFast",
        model: "VF e34",
        year: 2023,
        color: "Xanh Navy",
        status: "available",
        daily_rate: 1200000,
        is_electric: true,
        current_mileage: 6500,
        image_urls: [
          "https://oto-vinfastsaigon.com/wp-content/uploads/2022/02/Xe-dien-VinFast-e34-mau-xanh-Luxury-Blue.png",
        ],
      },
      {
        vehicle_type: vehicleTypes[1]._id,
        license_plate: "51B-22222",
        brand: "VinFast",
        model: "VF e34",
        year: 2023,
        color: "Trắng Ngọc Trai",
        status: "available",
        daily_rate: 1200000,
        is_electric: true,
        current_mileage: 7800,
        image_urls: [
          "https://giaiphapmarketing.vn/wp-content/uploads/2023/03/vf-e34-mau-trang_1651316818.jpg",
        ],
      },
      {
        vehicle_type: vehicleTypes[1]._id,
        license_plate: "51B-33333",
        brand: "VinFast",
        model: "VF e34",
        year: 2023,
        color: "Xám Titan",
        status: "maintenance",
        daily_rate: 1200000,
        is_electric: true,
        current_mileage: 12400,
        image_urls: [
          "https://media.vov.vn/sites/default/files/styles/large_watermark/public/2021-12/vf_e34_1.jpg",
        ],
      },
      {
        vehicle_type: vehicleTypes[1]._id,
        license_plate: "51B-44444",
        brand: "VinFast",
        model: "VF e34",
        year: 2023,
        color: "Đen",
        status: "available",
        daily_rate: 1200000,
        is_electric: true,
        current_mileage: 5200,
        image_urls: [
          "https://storage.googleapis.com/vinfast-data-01/vinfast-vf-e34-mau-den-jet-black_1650869071.png",
        ],
      },

      // VinFast VF 6 (4 xe)
      {
        vehicle_type: vehicleTypes[2]._id,
        license_plate: "51C-11111",
        brand: "VinFast",
        model: "VF 6 Eco",
        year: 2024,
        color: "Đỏ Ruby",
        status: "available",
        daily_rate: 1500000,
        is_electric: true,
        current_mileage: 4300,
        image_urls: [
          "https://vinfast-auto.com.vn/wp-content/uploads/2025/07/xe-vinfast-vf6-eco-mau-do.png",
        ],
      },
      {
        vehicle_type: vehicleTypes[2]._id,
        license_plate: "51C-22222",
        brand: "VinFast",
        model: "VF 6 Plus",
        year: 2024,
        color: "Trắng Ngọc Trai",
        status: "available",
        daily_rate: 1600000,
        is_electric: true,
        current_mileage: 3700,
        image_urls: [
          "https://cmu-cdn.vinfast.vn/2024/02/b9d24050-img_3145.jpg",
        ],
      },
      {
        vehicle_type: vehicleTypes[2]._id,
        license_plate: "51C-33333",
        brand: "VinFast",
        model: "VF 6 Plus",
        year: 2024,
        color: "Xanh Lục Bảo",
        status: "available",
        daily_rate: 1600000,
        is_electric: true,
        current_mileage: 6900,
        image_urls: [
          "https://xeotovinfast.com.vn/wp-content/uploads/2025/04/489675649_122196094202259210_1374416796202318158_n_result.jpg",
        ],
      },
      {
        vehicle_type: vehicleTypes[2]._id,
        license_plate: "51C-44444",
        brand: "VinFast",
        model: "VF 6 Plus",
        year: 2024,
        color: "Xám Titan",
        status: "rented",
        daily_rate: 1600000,
        is_electric: true,
        current_mileage: 2800,
        image_urls: [
          "https://vinfast-oto36.com/wp-content/uploads/2023/10/Vinfast-VF6-Mau-Xam-Titan.jpg",
        ],
      },

      // VinFast VF 8 (5 xe)
      {
        vehicle_type: vehicleTypes[3]._id,
        license_plate: "51D-11111",
        brand: "VinFast",
        model: "VF 8 Eco",
        year: 2024,
        color: "Xanh Đại Dương",
        status: "available",
        daily_rate: 2200000,
        is_electric: true,
        current_mileage: 5600,
        image_urls: [
          "https://tse3.mm.bing.net/th/id/OIP.Bn42Fc1jKJhV6hsaiPzvwQHaD5?rs=1&pid=ImgDetMain&o=7&rm=3",
        ],
      },
      {
        vehicle_type: vehicleTypes[3]._id,
        license_plate: "51D-22222",
        brand: "VinFast",
        model: "VF 8 Plus",
        year: 2024,
        color: "Trắng Ngọc Trai",
        status: "available",
        daily_rate: 2400000,
        is_electric: true,
        current_mileage: 4200,
        image_urls: [
          "https://tse2.mm.bing.net/th/id/OIP.z1c4rTA7Pv5ZBDl2jPsu_QHaCv?rs=1&pid=ImgDetMain&o=7&rm=3",
        ],
      },
      {
        vehicle_type: vehicleTypes[3]._id,
        license_plate: "51D-33333",
        brand: "VinFast",
        model: "VF 8 Plus",
        year: 2024,
        color: "Đen",
        status: "rented",
        daily_rate: 2400000,
        is_electric: true,
        current_mileage: 7100,
        image_urls: [
          "https://cmu-cdn.vinfast.vn/2022/10/54e02bb0-xe-dien-hien-nay-vf-8.jpg",
        ],
      },
      {
        vehicle_type: vehicleTypes[3]._id,
        license_plate: "51D-44444",
        brand: "VinFast",
        model: "VF 8 City Edition",
        year: 2024,
        color: "Xám Bạc",
        status: "available",
        daily_rate: 2500000,
        is_electric: true,
        current_mileage: 3100,
        image_urls: [
          "https://cmu-cdn.vinfast.vn/2023/02/bbc88ca8-b67de4ca-7075-4985-a18e-4921207bc9fe.jpeg",
        ],
      },
      {
        vehicle_type: vehicleTypes[3]._id,
        license_plate: "51D-55555",
        brand: "VinFast",
        model: "VF 8 City Edition",
        year: 2024,
        color: "Đỏ Ruby",
        status: "available",
        daily_rate: 2500000,
        is_electric: true,
        current_mileage: 1900,
        image_urls: [
          "https://tse4.mm.bing.net/th/id/OIP.vhVOVRHR9Wy8ChSNnTferAHaEK?rs=1&pid=ImgDetMain&o=7&rm=3",
        ],
      },

      // VinFast VF 9 (3 xe - Luxury)
      {
        vehicle_type: vehicleTypes[4]._id,
        license_plate: "51E-11111",
        brand: "VinFast",
        model: "VF 9 Eco",
        year: 2024,
        color: "Xanh Đại Dương",
        status: "available",
        daily_rate: 3500000,
        is_electric: true,
        current_mileage: 2800,
        image_urls: [
          "https://th.bing.com/th/id/R.337252a189650ec4affbc1a886a4e376?rik=LOY4mRC1xqXwcQ&pid=ImgRaw&r=0",
        ],
      },
      {
        vehicle_type: vehicleTypes[4]._id,
        license_plate: "51E-22222",
        brand: "VinFast",
        model: "VF 9 Plus",
        year: 2024,
        color: "Trắng Ngọc Trai",
        status: "available",
        daily_rate: 3800000,
        is_electric: true,
        current_mileage: 1500,
        image_urls: [
          "https://tse1.mm.bing.net/th/id/OIP.lsPG-BvRtNtfZPLMsL4HGQHaEi?rs=1&pid=ImgDetMain&o=7&rm=3",
        ],
      },
      {
        vehicle_type: vehicleTypes[4]._id,
        license_plate: "51E-33333",
        brand: "VinFast",
        model: "VF 9 Plus",
        year: 2024,
        color: "Đen",
        status: "available",
        daily_rate: 3800000,
        is_electric: true,
        current_mileage: 3200,
        image_urls: [
          "https://antimatter.vn/wp-content/uploads/2023/04/anh-vf9-tren-nen-troi-dep-1200x801.jpg",
        ],
      },
    ]);
    console.log("✅ Created 20 VinFast Vehicles");

    // ============================================
    // 7. CHARGING STATIONS (10 trạm sạc)
    // ============================================
    const chargingStations = await ChargingStation.insertMany([
      {
        name: "VinFast Charging Station - Vincom Center Đồng Khởi",
        address: "72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM",
        location: { lat: 10.7769, lng: 106.7009 },
        total_slots: 8,
        available_slots: 6,
        charging_rate: 3500,
        status: "active",
      },
      {
        name: "Tesla Supercharger - Landmark 81",
        address:
          "Landmark 81, 720A Đ. Điện Biên Phủ, Vinhomes Tân Cảng, Bình Thạnh, TP.HCM",
        location: { lat: 10.7943, lng: 106.7212 },
        total_slots: 12,
        available_slots: 8,
        charging_rate: 4000,
        status: "active",
      },
      {
        name: "EcoCharge Station - Crescent Mall",
        address: "101 Tôn Dật Tiên, Phường Tân Phú, Quận 7, TP.HCM",
        location: { lat: 10.7295, lng: 106.7191 },
        total_slots: 6,
        available_slots: 4,
        charging_rate: 3200,
        status: "active",
      },
      {
        name: "VinFast Charging Station - AEON Mall Tân Phú",
        address: "30 Bờ Bao Tân Thắng, Sơn Kỳ, Tân Phú, TP.HCM",
        location: { lat: 10.8006, lng: 106.6198 },
        total_slots: 10,
        available_slots: 7,
        charging_rate: 3500,
        status: "active",
      },
      {
        name: "Green Energy Station - Parkson Hùng Vương",
        address: "126 Hùng Vương, Phường 12, Quận 5, TP.HCM",
        location: { lat: 10.7549, lng: 106.6672 },
        total_slots: 5,
        available_slots: 3,
        charging_rate: 3000,
        status: "active",
      },
      {
        name: "EV Charge Hub - TTTM Gigamall",
        address: "240-242 Phạm Văn Đồng, Hiệp Bình Chánh, Thủ Đức, TP.HCM",
        location: { lat: 10.8411, lng: 106.7144 },
        total_slots: 8,
        available_slots: 5,
        charging_rate: 3300,
        status: "active",
      },
      {
        name: "VinFast Charging Station - Pearl Plaza",
        address: "561A Điện Biên Phủ, Phường 25, Bình Thạnh, TP.HCM",
        location: { lat: 10.7884, lng: 106.7096 },
        total_slots: 6,
        available_slots: 6,
        charging_rate: 3500,
        status: "active",
      },
      {
        name: "Tesla Destination Charger - Saigon Centre",
        address: "65 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
        location: { lat: 10.7729, lng: 106.7007 },
        total_slots: 4,
        available_slots: 2,
        charging_rate: 3800,
        status: "active",
      },
      {
        name: "EcoRides Charging Station - Vivo City",
        address: "1058 Nguyễn Văn Linh, Tân Phong, Quận 7, TP.HCM",
        location: { lat: 10.7369, lng: 106.7113 },
        total_slots: 7,
        available_slots: 5,
        charging_rate: 3400,
        status: "active",
      },
      {
        name: "Power Station - Sense City",
        address: "28 Mai Chí Thọ, Phường An Phú, TP Thủ Đức, TP.HCM",
        location: { lat: 10.8007, lng: 106.747 },
        total_slots: 6,
        available_slots: 4,
        charging_rate: 3600,
        status: "maintenance",
      },
    ]);
    console.log("✅ Created 10 Charging Stations");

    // ============================================
    // 8. PROMOTIONS (4 mã khuyến mãi)
    // ============================================
    const promotions = await Promotion.insertMany([
      {
        code: "ECORIDE2024",
        name: "Ưu đãi thuê xe điện 2024",
        discount_type: "percentage",
        discount_value: 15,
        max_discount_amount: 500000,
        min_booking_amount: 2000000,
        valid_from: new Date("2024-01-01"),
        valid_to: new Date("2024-12-31"),
        usage_limit: 100,
        used_count: 12,
        is_active: true,
      },
      {
        code: "NEWCUSTOMER",
        name: "Khuyến mãi khách hàng mới",
        discount_type: "fixed_amount",
        discount_value: 300000,
        min_booking_amount: 1500000,
        valid_from: new Date("2024-01-01"),
        valid_to: new Date("2024-12-31"),
        usage_limit: 200,
        used_count: 48,
        is_active: true,
      },
      {
        code: "WEEKEND20",
        name: "Giảm giá cuối tuần",
        discount_type: "percentage",
        discount_value: 20,
        max_discount_amount: 800000,
        min_booking_amount: 3000000,
        valid_from: new Date("2024-01-01"),
        valid_to: new Date("2024-06-30"),
        usage_limit: 50,
        used_count: 25,
        is_active: true,
      },
      {
        code: "VIP500K",
        name: "Ưu đãi khách VIP",
        discount_type: "fixed_amount",
        discount_value: 500000,
        min_booking_amount: 5000000,
        valid_from: new Date("2024-01-01"),
        valid_to: new Date("2024-12-31"),
        usage_limit: 30,
        used_count: 8,
        is_active: true,
      },
    ]);
    console.log("✅ Created 4 Promotions");

    // ============================================
    // 9. SAMPLE BOOKINGS (5 bookings mẫu)
    // ============================================
    const bookings = await Booking.insertMany([
      // Booking 1: Hoàn thành
      {
        customer: customers[0]._id,
        vehicle: vehicles[0]._id, // Tesla Model 3
        driver: null,
        managed_by: staff[0]._id,
        rental_type: "self_drive",
        start_date: new Date("2024-03-01"),
        end_date: new Date("2024-03-05"),
        actual_return_date: new Date("2024-03-05"),
        max_checkin_time: new Date("2024-03-01T15:00:00"),
        pickup_location: "123 Lê Lợi, Quận 1, TP.HCM",
        return_location: "123 Lê Lợi, Quận 1, TP.HCM",
        status: "completed",
        total_amount: 7200000, // 4 ngày x 1,800,000
        deposit_amount: 7200000, // 100% deposit for B2C
        final_amount: 0,
      },
      // Booking 2: Đang thuê
      {
        customer: customers[1]._id,
        vehicle: vehicles[4]._id, // VinFast VF8
        driver: drivers[2]._id, // Có tài xế
        managed_by: staff[0]._id,
        rental_type: "with_driver",
        start_date: new Date("2024-03-10"),
        end_date: new Date("2024-03-15"),
        max_checkin_time: new Date("2024-03-10T15:00:00"),
        pickup_location: "456 Nguyễn Huệ, Quận 1, TP.HCM",
        return_location: "456 Nguyễn Huệ, Quận 1, TP.HCM",
        status: "in_progress",
        total_amount: 12000000, // 5 ngày x 2,400,000
        deposit_amount: 12000000,
        final_amount: null,
      },
      // Booking 3: Đã giao xe
      {
        customer: customers[2]._id,
        vehicle: vehicles[6]._id, // Hyundai Ioniq 5
        driver: null,
        managed_by: staff[1]._id,
        rental_type: "self_drive",
        start_date: new Date("2024-03-12"),
        end_date: new Date("2024-03-16"),
        max_checkin_time: new Date("2024-03-12T15:00:00"),
        pickup_location: "789 Hai Bà Trưng, Quận 3, TP.HCM",
        return_location: "789 Hai Bà Trưng, Quận 3, TP.HCM",
        status: "vehicle_delivered",
        total_amount: 7600000, // 4 ngày x 1,900,000
        deposit_amount: 7600000,
        final_amount: null,
      },
      // Booking 4: Đã confirm, chưa giao xe
      {
        customer: customers[3]._id,
        vehicle: vehicles[15]._id, // Kia EV6
        driver: null,
        managed_by: staff[0]._id,
        rental_type: "self_drive",
        start_date: new Date("2024-03-20"),
        end_date: new Date("2024-03-23"),
        max_checkin_time: new Date("2024-03-20T15:00:00"),
        pickup_location: "321 Trần Hưng Đạo, Quận 5, TP.HCM",
        return_location: "321 Trần Hưng Đạo, Quận 5, TP.HCM",
        status: "confirmed",
        total_amount: 6300000, // 3 ngày x 2,100,000
        deposit_amount: 6300000,
        final_amount: null,
      },
      // Booking 5: Pending payment
      {
        customer: customers[4]._id,
        vehicle: vehicles[18]._id, // Mercedes EQS
        driver: drivers[0]._id, // Có tài xế - luxury
        managed_by: staff[1]._id,
        rental_type: "with_driver",
        start_date: new Date("2024-03-25"),
        end_date: new Date("2024-03-28"),
        max_checkin_time: new Date("2024-03-25T15:00:00"),
        pickup_location: "654 Võ Văn Tần, Quận 3, TP.HCM",
        return_location: "654 Võ Văn Tần, Quận 3, TP.HCM",
        status: "pending",
        total_amount: 16500000, // 3 ngày x 5,500,000
        deposit_amount: 16500000,
        final_amount: null,
      },
    ]);
    console.log("✅ Created 5 Sample Bookings");

    // ============================================
    // 10. PAYMENTS (3 payments cho bookings đã hoàn thành)
    // ============================================
    const payments = await Payment.insertMany([
      {
        booking: bookings[0]._id,
        customer: customers[0]._id,
        payment_type: "rental_fee",
        amount: 7200000,
        payment_method: "vnpay",
        status: "completed",
        transaction_id: "VNP2024030112345",
        processed_by: null,
      },
      {
        booking: bookings[1]._id,
        customer: customers[1]._id,
        payment_type: "rental_fee",
        amount: 12000000,
        payment_method: "momo",
        status: "completed",
        transaction_id: "MOMO2024031067890",
        processed_by: null,
      },
      {
        booking: bookings[2]._id,
        customer: customers[2]._id,
        payment_type: "rental_fee",
        amount: 7600000,
        payment_method: "vnpay",
        status: "completed",
        transaction_id: "VNP2024031211223",
        processed_by: null,
      },
    ]);
    console.log("✅ Created 3 Payments");

    // ============================================
    // 11. REVIEWS (3 reviews)
    // ============================================
    const reviews = await Review.insertMany([
      {
        booking: bookings[0]._id,
        customer: customers[0]._id,
        vehicle: vehicles[0]._id,
        review_type: "vehicle",
        rating: 5,
        comment:
          "Tesla Model 3 rất tuyệt vời! Xe êm, tăng tốc mạnh, và tiết kiệm chi phí nhiên liệu. Dịch vụ của EcoRides rất chuyên nghiệp.",
      },
      {
        booking: bookings[0]._id,
        customer: customers[0]._id,
        review_type: "overall",
        rating: 5,
        comment:
          "Quy trình thuê xe rất nhanh gọn, giao xe đúng giờ. Rất hài lòng!",
      },
      {
        booking: bookings[1]._id,
        customer: customers[1]._id,
        vehicle: vehicles[4]._id,
        driver: drivers[2]._id,
        review_type: "driver",
        rating: 5,
        comment:
          "Tài xế lái xe rất cẩn thận và nhiệt tình, giải thích rất tốt về xe điện.",
      },
      {
        booking: bookings[1]._id,
        customer: customers[1]._id,
        vehicle: vehicles[4]._id,
        review_type: "vehicle",
        rating: 4,
        comment:
          "VinFast VF8 rộng rãi, phù hợp cho gia đình. Cốp rộng, ghế ngồi thoải mái.",
      },
    ]);
    console.log("✅ Created 4 Reviews");

    // ============================================
    // HOÀN THÀNH
    // ============================================
    console.log("\n🎉 ===== SEED DATABASE HOÀN THÀNH ===== 🎉\n");
    console.log("📊 THỐNG KÊ:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🛒 Customers: ${customers.length}`);
    console.log(`   🚗 Drivers: ${drivers.length}`);
    console.log(`   👔 Staff: ${staff.length}`);
    console.log(`   🚙 Vehicle Types: ${vehicleTypes.length}`);
    console.log(`   🔋 Electric Vehicles: ${vehicles.length}`);
    console.log(`   ⚡ Charging Stations: ${chargingStations.length}`);
    console.log(`   🎫 Promotions: ${promotions.length}`);
    console.log(`   📝 Bookings: ${bookings.length}`);
    console.log(`   💳 Payments: ${payments.length}`);
    console.log(`   ⭐ Reviews: ${reviews.length}\n`);

    console.log("🔐 LOGIN CREDENTIALS:");
    console.log(
      "   📧 Email: customer1@ecorides.com | 🔑 Password: password123",
    );
    console.log(
      "   📧 Email: driver1@ecorides.com   | 🔑 Password: password123",
    );
    console.log(
      "   📧 Email: staff1@ecorides.com    | 🔑 Password: password123\n",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
