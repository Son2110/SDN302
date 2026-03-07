import { User, Customer, Driver } from "../models/user.model.js";
import { getUserRoles } from "../middlewares/authMiddleware.js";

// ==================== CUSTOMER APIs ====================

/**
 * @desc    Get all customers
 * @route   GET /api/users/customers
 * @access  Staff only
 */
export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build search query
    let userQuery = {};
    if (search) {
      userQuery = {
        $or: [
          { full_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Find matching users first
    const users = await User.find(userQuery).select("_id");
    const userIds = users.map((u) => u._id);

    // Get customers with populated user info
    const customers = await Customer.find({ user: { $in: userIds } })
      .populate("user", "-password_hash")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Customer.countDocuments({ user: { $in: userIds } });

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: customers,
    });
  } catch (error) {
    console.error("Error in getAllCustomers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách khách hàng",
      error: error.message,
    });
  }
};

/**
 * @desc    Get customer by ID
 * @route   GET /api/users/customers/:id
 * @access  Customer (own profile) or Staff
 */
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id)
      .populate("user", "-password_hash")
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách hàng",
      });
    }

    // Authorization: customer can only see own profile, staff can see all
    const isOwnProfile =
      req.user._id.toString() === customer.user._id.toString();
    const isStaff = req.user.roles.includes("staff");

    if (!isOwnProfile && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem thông tin này",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error in getCustomerById:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin khách hàng",
      error: error.message,
    });
  }
};

/**
 * @desc    Update customer profile
 * @route   PUT /api/users/customers/:id
 * @access  Customer (own profile) or Staff
 */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone,
      avatar_url,
      driver_license,
      date_of_birth,
      address,
    } = req.body;

    const customer = await Customer.findById(id).populate("user");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách hàng",
      });
    }

    // Authorization: customer can only update own profile, staff can update all
    const isOwnProfile =
      req.user._id.toString() === customer.user._id.toString();
    const isStaff = req.user.roles.includes("staff");

    if (!isOwnProfile && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật thông tin này",
      });
    }

    // Update User fields
    if (full_name) customer.user.full_name = full_name;
    if (phone) customer.user.phone = phone;
    if (avatar_url !== undefined) customer.user.avatar_url = avatar_url;

    // Update Customer fields
    if (driver_license !== undefined) customer.driver_license = driver_license;
    if (date_of_birth) customer.date_of_birth = date_of_birth;
    if (address !== undefined) customer.address = address;

    await customer.user.save();
    await customer.save();

    const updatedCustomer = await Customer.findById(id)
      .populate("user", "-password_hash")
      .lean();

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin khách hàng thành công",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Error in updateCustomer:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông tin khách hàng",
      error: error.message,
    });
  }
};

// ==================== DRIVER APIs ====================

/**
 * @desc    Get all drivers
 * @route   GET /api/users/drivers
 * @access  Staff only
 */
export const getAllDrivers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const skip = (page - 1) * limit;

    // Build driver query
    let driverQuery = {};
    if (status && ["available", "busy", "offline"].includes(status)) {
      driverQuery.status = status;
    }

    // Build search query for user
    let userQuery = {};
    if (search) {
      userQuery = {
        $or: [
          { full_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Find matching users first
    const users = await User.find(userQuery).select("_id");
    const userIds = users.map((u) => u._id);

    // Combine queries
    if (userIds.length > 0) {
      driverQuery.user = { $in: userIds };
    } else if (search) {
      // No users match search, return empty
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: parseInt(page),
        pages: 0,
        data: [],
      });
    }

    // Get drivers with populated user info
    const drivers = await Driver.find(driverQuery)
      .populate("user", "-password_hash")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Driver.countDocuments(driverQuery);

    res.status(200).json({
      success: true,
      count: drivers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: drivers,
    });
  } catch (error) {
    console.error("Error in getAllDrivers:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách tài xế",
      error: error.message,
    });
  }
};

/**
 * @desc    Get driver by ID
 * @route   GET /api/users/drivers/:id
 * @access  Driver (own profile) or Staff
 */
export const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id)
      .populate("user", "-password_hash")
      .lean();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài xế",
      });
    }

    // Authorization: driver can only see own profile, staff can see all
    const isOwnProfile = req.user._id.toString() === driver.user._id.toString();
    const isStaff = req.user.roles.includes("staff");

    if (!isOwnProfile && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem thông tin này",
      });
    }

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error("Error in getDriverById:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin tài xế",
      error: error.message,
    });
  }
};

/**
 * @desc    Update driver profile
 * @route   PUT /api/users/drivers/:id
 * @access  Driver (own profile) or Staff
 */
export const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      phone,
      avatar_url,
      license_number,
      license_type,
      license_expiry,
      experience_years,
      status,
    } = req.body;

    const driver = await Driver.findById(id).populate("user");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài xế",
      });
    }

    // Authorization: driver can only update own profile, staff can update all
    const isOwnProfile = req.user._id.toString() === driver.user._id.toString();
    const isStaff = req.user.roles.includes("staff");

    if (!isOwnProfile && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật thông tin này",
      });
    }

    // Update User fields
    if (full_name) driver.user.full_name = full_name;
    if (phone) driver.user.phone = phone;
    if (avatar_url !== undefined) driver.user.avatar_url = avatar_url;

    // Update Driver fields
    if (license_number) {
      // Check if license_number is unique
      const existing = await Driver.findOne({
        license_number,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Số giấy phép lái xe đã tồn tại",
        });
      }
      driver.license_number = license_number;
    }

    if (license_type) driver.license_type = license_type;
    if (license_expiry) driver.license_expiry = license_expiry;
    if (experience_years !== undefined)
      driver.experience_years = experience_years;

    // Only staff can update status
    if (status && isStaff) {
      if (!["available", "busy", "offline"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }
      driver.status = status;
    }

    await driver.user.save();
    await driver.save();

    const updatedDriver = await Driver.findById(id)
      .populate("user", "-password_hash")
      .lean();

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin tài xế thành công",
      data: updatedDriver,
    });
  } catch (error) {
    console.error("Error in updateDriver:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật thông tin tài xế",
      error: error.message,
    });
  }
};

// ==================== DRIVER REGISTRATION ====================

/**
 * @desc    Customer registers to become driver
 * @route   POST /api/users/driver-registration
 * @access  Customer only
 */
export const registerAsDriver = async (req, res) => {
  try {
    const { license_number, license_type, license_expiry, experience_years } =
      req.body;

    // Validate required fields
    if (
      !license_number ||
      !license_type ||
      !license_expiry ||
      experience_years === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng cung cấp đầy đủ thông tin: license_number, license_type, license_expiry, experience_years",
      });
    }

    // Check if user is already a driver
    const existingDriver = await Driver.findOne({ user: req.user._id });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã là tài xế rồi",
      });
    }

    // Check if license_number is unique
    const duplicateLicense = await Driver.findOne({ license_number });
    if (duplicateLicense) {
      return res.status(400).json({
        success: false,
        message: "Số giấy phép lái xe đã được đăng ký",
      });
    }

    // Validate license_expiry is in the future
    const expiryDate = new Date(license_expiry);
    if (expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Giấy phép lái xe đã hết hạn",
      });
    }

    // Create Driver record
    const newDriver = await Driver.create({
      user: req.user._id,
      license_number,
      license_type,
      license_expiry: expiryDate,
      experience_years: parseInt(experience_years),
      status: "available", // Default status
    });

    // Populate user info
    const driver = await Driver.findById(newDriver._id)
      .populate("user", "-password_hash")
      .lean();

    // Get updated roles
    const roles = await getUserRoles(req.user._id);

    res.status(201).json({
      success: true,
      message: "Đăng ký làm tài xế thành công! Bạn có thể bắt đầu nhận chuyến.",
      data: {
        driver,
        roles, // Now includes 'driver'
      },
    });
  } catch (error) {
    console.error("Error in registerAsDriver:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi đăng ký làm tài xế",
      error: error.message,
    });
  }
};

/**
 * @desc    Get my profile (customer or driver)
 * @route   GET /api/users/my-profile
 * @access  Authenticated
 */
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check roles
    const isCustomer = req.user.roles.includes("customer");
    const isDriver = req.user.roles.includes("driver");

    let customerData = null;
    let driverData = null;

    if (isCustomer) {
      customerData = await Customer.findOne({ user: userId })
        .populate("user", "-password_hash")
        .lean();
    }

    if (isDriver) {
      driverData = await Driver.findOne({ user: userId })
        .populate("user", "-password_hash")
        .lean();
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: req.user._id,
          email: req.user.email,
          full_name: req.user.full_name,
          phone: req.user.phone,
          avatar_url: req.user.avatar_url,
          is_active: req.user.is_active,
        },
        roles: req.user.roles,
        customer: customerData,
        driver: driverData,
      },
    });
  } catch (error) {
    console.error("Error in getMyProfile:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin cá nhân",
      error: error.message,
    });
  }
};
