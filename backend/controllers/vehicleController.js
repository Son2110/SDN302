import { Vehicle, VehicleType } from "../models/vehicle.model.js";
import { Booking } from "../models/booking.model.js";

/**
 * Get all vehicles with pagination and filters
 * GET /api/vehicles
 */
export const getVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      vehicle_type,
      category,
      min_price,
      max_price,
      brand,
      search,
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (vehicle_type) {
      filter.vehicle_type = vehicle_type;
    }

    if (brand) {
      filter.brand = { $regex: brand, $options: "i" };
    }

    if (min_price || max_price) {
      filter.daily_rate = {};
      if (min_price) filter.daily_rate.$gte = Number(min_price);
      if (max_price) filter.daily_rate.$lte = Number(max_price);
    }

    // Search by brand, model, or license plate
    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { license_plate: { $regex: search, $options: "i" } },
      ];
    }

    // If category filter, need to join with VehicleType
    let query = Vehicle.find(filter).populate("vehicle_type");

    if (category) {
      query = query.where("vehicle_type.category").equals(category);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const vehicles = await query
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Vehicle.countDocuments(filter);

    res.json({
      success: true,
      vehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get vehicle by ID
 * GET /api/vehicles/:id
 */
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "vehicle_type"
    );

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    res.json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all vehicle types
 * GET /api/vehicles/types
 */
export const getVehicleTypes = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {};
    if (category) {
      filter.category = category;
    }

    const vehicleTypes = await VehicleType.find(filter).sort({ category: 1 });

    res.json({ success: true, vehicleTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Search vehicles with advanced filters
 * GET /api/vehicles/search
 */
export const searchVehicles = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      vehicle_type,
      category,
      min_price,
      max_price,
      seats,
      transmission,
      fuel_type,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter
    const filter = { status: "available" };

    if (vehicle_type) {
      filter.vehicle_type = vehicle_type;
    }

    if (min_price || max_price) {
      filter.daily_rate = {};
      if (min_price) filter.daily_rate.$gte = Number(min_price);
      if (max_price) filter.daily_rate.$lte = Number(max_price);
    }

    // If date range provided, check availability
    if (start_date && end_date) {
      const conflictingBookings = await Booking.find({
        status: {
          $in: ["pending", "confirmed", "vehicle_delivered", "in_progress"],
        },
        $or: [
          {
            start_date: { $lte: new Date(end_date) },
            end_date: { $gte: new Date(start_date) },
          },
        ],
      }).select("vehicle");

      const conflictingVehicleIds = conflictingBookings.map(
        (b) => b.vehicle.toString()
      );
      filter._id = { $nin: conflictingVehicleIds };
    }

    let query = Vehicle.find(filter).populate("vehicle_type");

    if (category) {
      query = query.where("vehicle_type.category").equals(category);
    }

    if (seats) {
      query = query.where("vehicle_type.seat_capacity").gte(Number(seats));
    }

    if (transmission) {
      query = query.where("vehicle_type.transmission").equals(transmission);
    }

    if (fuel_type) {
      query = query.where("vehicle_type.fuel_type").equals(fuel_type);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const vehicles = await query
      .skip(skip)
      .limit(Number(limit))
      .sort({ daily_rate: 1 });

    const total = await Vehicle.countDocuments(filter);

    res.json({
      success: true,
      vehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get available vehicles in date range
 * GET /api/vehicles/available
 */
export const getAvailableVehicles = async (req, res) => {
  try {
    const { start_date, end_date, vehicle_type, category, min_price, max_price } =
      req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "start_date and end_date are required",
      });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: "start_date must be before end_date",
      });
    }

    // Find conflicting bookings
    const conflictingBookings = await Booking.find({
      status: {
        $in: ["pending", "confirmed", "vehicle_delivered", "in_progress"],
      },
      $or: [
        {
          start_date: { $lte: endDate },
          end_date: { $gte: startDate },
        },
      ],
    }).select("vehicle");

    const conflictingVehicleIds = conflictingBookings.map((b) => b.vehicle);

    // Build filter
    const filter = {
      status: "available",
      _id: { $nin: conflictingVehicleIds },
    };

    if (vehicle_type) {
      filter.vehicle_type = vehicle_type;
    }

    if (min_price || max_price) {
      filter.daily_rate = {};
      if (min_price) filter.daily_rate.$gte = Number(min_price);
      if (max_price) filter.daily_rate.$lte = Number(max_price);
    }

    let query = Vehicle.find(filter).populate("vehicle_type");

    if (category) {
      query = query.where("vehicle_type.category").equals(category);
    }

    const vehicles = await query.sort({ daily_rate: 1 });

    res.json({
      success: true,
      vehicles,
      count: vehicles.length,
      date_range: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
