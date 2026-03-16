import { Vehicle, VehicleType } from "../models/vehicle.model.js";
import { Booking } from "../models/booking.model.js";

// ==================== GET ALL VEHICLES ====================
// @route GET /api/vehicles
// @access Private (Staff)
export const getAllVehicles = async (req, res) => {
  try {
    const { status, brand, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (brand) filter.brand = { $regex: brand, $options: "i" };

    const vehicles = await Vehicle.find(filter)
      .populate("vehicle_type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Vehicle.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET VEHICLE BY ID ====================
// @route GET /api/vehicles/:id
// @access Private (Staff)
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "vehicle_type",
    );

    if (!vehicle)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy xe." });

    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CREATE VEHICLE ====================
// @route POST /api/vehicles
// @access Private (Staff)
export const createVehicle = async (req, res) => {
  try {
    const {
      vehicle_type,
      license_plate,
      brand,
      model,
      year,
      color,
      daily_rate,
      is_electric,
      current_mileage,
    } = req.body;

    // Handle Images (Multer + Cloudinary)
    let image_urls = [];
    // 1. Get from uploaded files
    if (req.files && req.files.length > 0) {
      image_urls = req.files.map((file) => file.path);
    }
    // 2. Get from body (if mixing URLs provided manually)
    if (req.body.image_urls) {
      const bodyImages = Array.isArray(req.body.image_urls)
        ? req.body.image_urls
        : [req.body.image_urls];
      image_urls = [...image_urls, ...bodyImages];
    }

    // Validate vehicle_type tồn tại
    const typeExists = await VehicleType.findById(vehicle_type);
    if (!typeExists)
      return res
        .status(404)
        .json({ success: false, message: "Loại xe không tồn tại." });

    const vehicle = await Vehicle.create({
      vehicle_type,
      license_plate,
      brand,
      model,
      year,
      color,
      daily_rate,
      is_electric: is_electric ?? false,
      current_mileage: current_mileage ?? 0,
      image_urls: image_urls,
      status: "available",
    });

    const populated = await vehicle.populate("vehicle_type");

    res.status(201).json({
      success: true,
      message: "Tạo xe thành công.",
      data: populated,
    });
  } catch (error) {
    // Duplicate license_plate
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Biển số xe đã tồn tại trong hệ thống.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE VEHICLE ====================
// @route PUT /api/vehicles/:id
// @access Private (Staff)
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy xe." });

    // Không cho sửa status qua endpoint này
    if (req.body.status !== undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Không thể cập nhật trạng thái xe qua endpoint này. Dùng PATCH /api/vehicles/:id/status.",
      });
    }

    const {
      vehicle_type,
      license_plate,
      brand,
      model,
      year,
      color,
      daily_rate,
      is_electric,
      current_mileage,
    } = req.body;

    // Handle Images
    let finalImageUrls = undefined; // Undefined means no update to this field
    // 1. New images from upload
    const uploadedImages =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.path)
        : [];
    // 2. Existing/Manual images from body
    let bodyImages = [];
    if (req.body.image_urls) {
      bodyImages = Array.isArray(req.body.image_urls)
        ? req.body.image_urls
        : [req.body.image_urls];
    }
    // Only update if there's any change requested (upload or body urls provided)
    if ((req.files && req.files.length > 0) || req.body.image_urls) {
      finalImageUrls = [...bodyImages, ...uploadedImages];
    } else if (req.body.image_urls === "") {
      // Case: user wants to clear all images? Or just didn't send anything?
      // If image_urls explicitly empty string/array -> clear?
      // Let's assume sending empty array clears it. Empty string -> ignore.
    }

    // Validate vehicle_type nếu có đổi
    if (vehicle_type && vehicle_type !== vehicle.vehicle_type.toString()) {
      const typeExists = await VehicleType.findById(vehicle_type);
      if (!typeExists)
        return res
          .status(404)
          .json({ success: false, message: "Loại xe không tồn tại." });
    }

    const updates = {
      ...(vehicle_type && { vehicle_type }),
      ...(license_plate && { license_plate }),
      ...(brand && { brand }),
      ...(model && { model }),
      ...(year && { year }),
      ...(color && { color }),
      ...(daily_rate && { daily_rate }),
      ...(is_electric !== undefined && { is_electric }),
      ...(current_mileage !== undefined && { current_mileage }),
      ...(finalImageUrls !== undefined && { image_urls: finalImageUrls }),
    };

    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("vehicle_type");

    res.status(200).json({
      success: true,
      message: "Cập nhật xe thành công.",
      data: updated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Biển số xe đã tồn tại trong hệ thống.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== DELETE VEHICLE ====================
// @route DELETE /api/vehicles/:id
// @access Private (Staff)
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy xe." });

    // Không cho xoá xe đang được thuê
    if (vehicle.status === "rented") {
      return res.status(400).json({
        success: false,
        message: "Không thể xoá xe đang được thuê.",
      });
    }

    // Không cho xoá nếu còn booking active
    const activeBooking = await Booking.findOne({
      vehicle: vehicle._id,
      status: {
        $nin: ["cancelled", "completed", "deposit_lost", "vehicle_returned"],
      },
    });

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        message: "Không thể xoá xe vì còn đơn đặt xe đang hoạt động.",
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Đã xoá xe thành công.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE VEHICLE STATUS ====================
// @route PATCH /api/vehicles/:id/status
// @access Private (Staff)
export const updateVehicleStatus = async (req, res) => {
  try {
    const { status, maintenance_note } = req.body;

    const allowedStatuses = ["available", "maintenance"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          'Status không hợp lệ. Chỉ được phép set "available" hoặc "maintenance". Trạng thái "rented" do hệ thống tự quản lý.',
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy xe." });

    // Nếu set maintenance → kiểm tra không có booking active
    if (status === "maintenance") {
      const activeBooking = await Booking.findOne({
        vehicle: vehicle._id,
        status: {
          $nin: ["cancelled", "completed", "deposit_lost", "vehicle_returned"],
        },
      });

      if (activeBooking) {
        return res.status(400).json({
          success: false,
          message:
            "Không thể chuyển xe sang bảo trì khi còn đơn đặt xe đang hoạt động.",
          active_booking_id: activeBooking._id,
        });
      }
    }

    vehicle.status = status;
    await vehicle.save();

    const message =
      status === "maintenance"
        ? `Xe đã chuyển sang trạng thái bảo trì.${maintenance_note ? " Ghi chú: " + maintenance_note : ""}`
        : "Xe đã sẵn sàng hoạt động trở lại.";

    res.status(200).json({
      success: true,
      message,
      data: {
        vehicle_id: vehicle._id,
        license_plate: vehicle.license_plate,
        status: vehicle.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== GET ALL VEHICLE TYPES ====================
// @route GET /api/vehicles/types
// @access Private (Staff)
export const getAllVehicleTypes = async (req, res) => {
  try {
    const types = await VehicleType.find().sort({ type_name: 1 });

    res.status(200).json({
      success: true,
      count: types.length,
      data: types,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== CREATE VEHICLE TYPE ====================
// @route POST /api/vehicles/types
// @access Private (Staff)
export const createVehicleType = async (req, res) => {
  try {
    const {
      type_name,
      category,
      seat_capacity,
      transmission,
      fuel_type,
      battery_capacity_kwh,
      base_price_per_day,
      charging_cost_per_kwh,
      image_url,
    } = req.body;

    const vehicleType = await VehicleType.create({
      type_name,
      category,
      seat_capacity,
      transmission,
      fuel_type,
      ...(battery_capacity_kwh !== undefined && { battery_capacity_kwh }),
      base_price_per_day,
      ...(charging_cost_per_kwh !== undefined && { charging_cost_per_kwh }),
      ...(image_url && { image_url }),
    });

    res.status(201).json({
      success: true,
      message: "Tạo loại xe thành công.",
      data: vehicleType,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
