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
      message: "Error fetching customer list",
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
        message: "Customer not found",
      });
    }

    // Authorization: customer can only see own profile, staff can see all
    const isOwnProfile =
      req.user._id.toString() === customer.user._id.toString();
    const isStaff = req.user.roles.includes("staff");

    if (!isOwnProfile && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this information",
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
      message: "Error fetching customer info",
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
        message: "Customer not found",
      });
    }

    // Authorization: customer can only update own profile, staff can update all
    const isOwnProfile =
      req.user._id.toString() === customer.user._id.toString();
    const isStaff = req.user.roles.includes("staff");

    if (!isOwnProfile && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this information",
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
      message: "Customer profile updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Error in updateCustomer:", error);
    res.status(500).json({
      success: false,
      message: "Error updating customer info",
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
    const { search = "", status = "" } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build driver query — never show pending or rejected here (they have their own contexts)
    let driverQuery = {};
    if (
      status &&
      ["available", "busy", "offline"].includes(status)
    ) {
      driverQuery.status = status;
    } else {
      driverQuery.status = { $nin: ["pending", "rejected"] };
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
      message: "Error fetching driver list",
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
        message: "Driver not found",
      });
    }

    // Authorization: driver can only see own profile, staff can see all
    const isOwnProfile = req.user._id.toString() === driver.user._id.toString();
    const isStaff = req.user.roles.includes("staff");

    if (!isOwnProfile && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this information",
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
      message: "Error fetching driver info",
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
    } = req.body;

    const driver = await Driver.findById(id).populate("user");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Authorization: driver can only update own profile, staff can update all
    const isOwnProfile = req.user._id.toString() === driver.user._id.toString();
    const isStaff = req.user.roles.includes("staff");

    if (!isOwnProfile && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this information",
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
          message: "Driver's license number already exists",
        });
      }
      driver.license_number = license_number;
    }

    if (license_type) driver.license_type = license_type;
    if (license_expiry) driver.license_expiry = license_expiry;
    if (experience_years !== undefined) {
      const parsedYears = parseInt(experience_years);
      if (isNaN(parsedYears) || parsedYears < 0) {
        return res.status(400).json({
          success: false,
          message: "Experience years must be a non-negative number",
        });
      }
      driver.experience_years = parsedYears;
    }



    await driver.user.save();
    await driver.save();

    const updatedDriver = await Driver.findById(id)
      .populate("user", "-password_hash")
      .lean();

    res.status(200).json({
      success: true,
      message: "Driver profile updated successfully",
      data: updatedDriver,
    });
  } catch (error) {
    console.error("Error in updateDriver:", error);
    res.status(500).json({
      success: false,
      message: "Error updating driver profile",
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
          "Please provide all required fields: license_number, license_type, license_expiry, experience_years",
      });
    }

    // Check if user is already a driver
    const existingDriver = await Driver.findOne({ user: req.user._id });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        message: "You are already a driver",
      });
    }

    // Check if license_number is unique
    const duplicateLicense = await Driver.findOne({ license_number });
    if (duplicateLicense) {
      return res.status(400).json({
        success: false,
        message: "Driver's license number has already been registered",
      });
    }

    // Validate experience_years
    const parsedExperienceYears = parseInt(experience_years);
    if (isNaN(parsedExperienceYears) || parsedExperienceYears < 1) {
      return res.status(400).json({
        success: false,
        message: "Experience years must be at least 1",
      });
    }

    // Validate license_expiry is in the future
    const expiryDate = new Date(license_expiry);
    if (expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Driver's license has expired",
      });
    }

    // Create Driver record with pending status
    const newDriver = await Driver.create({
      user: req.user._id,
      license_number,
      license_type,
      license_expiry: expiryDate,
      experience_years: parsedExperienceYears,
      status: "pending", // Awaiting staff approval
    });

    // Auto-update customer's driver_license field
    await Customer.findOneAndUpdate(
      { user: req.user._id },
      { driver_license: license_number },
    );

    // Populate user info
    const driver = await Driver.findById(newDriver._id)
      .populate("user", "-password_hash")
      .lean();

    res.status(201).json({
      success: true,
      message:
        "Driver registration successful! Please wait for staff approval.",
      data: driver,
    });
  } catch (error) {
    console.error("Error in registerAsDriver:", error);
    res.status(500).json({
      success: false,
      message: "Error during driver registration",
      error: error.message,
    });
  }
};

/**
 * @desc    Re-apply driver registration after rejection (Customer only)
 * @route   PUT /api/users/driver-registration
 * @access  Customer only
 */
export const reapplyAsDriver = async (req, res) => {
  try {
    const { license_number, license_type, license_expiry, experience_years } =
      req.body;

    if (
      !license_number ||
      !license_type ||
      !license_expiry ||
      experience_years === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required information",
      });
    }

    // Must have an existing rejected record
    const existingDriver = await Driver.findOne({ user: req.user._id });
    if (!existingDriver) {
      return res.status(400).json({
        success: false,
        message: "You have not registered as a driver yet",
      });
    }
    if (existingDriver.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "You can only re-apply if your profile was rejected",
      });
    }

    // Validate experience_years
    const parsedExperienceYears = parseInt(experience_years);
    if (isNaN(parsedExperienceYears) || parsedExperienceYears < 1) {
      return res.status(400).json({
        success: false,
        message: "Experience years must be at least 1",
      });
    }

    // Check license_expiry is in the future
    const expiryDate = new Date(license_expiry);
    if (expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Driver's license has expired",
      });
    }

    // Check license_number unique (excluding own record)
    const duplicateLicense = await Driver.findOne({
      license_number,
      _id: { $ne: existingDriver._id },
    });
    if (duplicateLicense) {
      return res.status(400).json({
        success: false,
        message: "Driver's license has already been registered by another user",
      });
    }

    // Update record back to pending
    existingDriver.license_number = license_number;
    existingDriver.license_type = license_type;
    existingDriver.license_expiry = expiryDate;
    existingDriver.experience_years = parsedExperienceYears;

    // Auto-update customer's driver_license field
    await Customer.findOneAndUpdate(
      { user: req.user._id },
      { driver_license: license_number },
    );
    existingDriver.status = "pending";
    existingDriver.rejection_reason = undefined;
    await existingDriver.save();

    const driver = await Driver.findById(existingDriver._id)
      .populate("user", "-password_hash")
      .lean();

    res.status(200).json({
      success: true,
      message: "Application resubmitted successfully! Please wait for staff approval.",
      data: driver,
    });
  } catch (error) {
    console.error("Error in reapplyAsDriver:", error);
    res.status(500).json({
      success: false,
      message: "Error resubmitting application",
      error: error.message,
    });
  }
};

export const getMyDriverStatus = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id })
      .populate("approved_by", "full_name email")
      .lean();

    if (!driver) {
      return res.status(200).json({
        success: true,
        data: null, // Not registered yet
      });
    }

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error("Error in getMyDriverStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching driver registration status",
      error: error.message,
    });
  }
};

/**
 * @desc    Get pending drivers (Staff only)
 * @route   GET /api/users/drivers/pending
 * @access  Staff only
 */
export const getPendingDrivers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Get pending drivers only
    const drivers = await Driver.find({ status: "pending" })
      .populate("user", "-password_hash")
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Driver.countDocuments({ status: "pending" });

    res.status(200).json({
      success: true,
      count: drivers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: drivers,
    });
  } catch (error) {
    console.error("Error in getPendingDrivers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending driver list",
      error: error.message,
    });
  }
};

/**
 * @desc    Get driver statistics (Staff only)
 * @route   GET /api/users/drivers/stats
 * @access  Staff only
 */
export const getDriverStats = async (req, res) => {
  try {
    const total = await Driver.countDocuments({ status: { $ne: "rejected" } });
    const pending = await Driver.countDocuments({ status: "pending" });
    const available = await Driver.countDocuments({ status: "available" });
    const busy = await Driver.countDocuments({ status: "busy" });
    const offline = await Driver.countDocuments({ status: "offline" });
    const rejected = await Driver.countDocuments({ status: "rejected" });

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        available,
        busy,
        offline,
        rejected,
      },
    });
  } catch (error) {
    console.error("Error in getDriverStats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching driver statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Approve driver registration (Staff only)
 * @route   PATCH /api/users/drivers/:id/approve
 * @access  Staff only
 */
export const approveDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    if (driver.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This driver has already been processed",
      });
    }

    // Update driver status to available
    driver.status = "available";
    driver.approved_at = new Date();
    driver.approved_by = req.user._id;
    await driver.save();

    // Populate user info
    const updatedDriver = await Driver.findById(driver._id)
      .populate("user", "-password_hash")
      .populate("approved_by", "full_name email")
      .lean();

    res.status(200).json({
      success: true,
      message: "Driver approved successfully",
      data: updatedDriver,
    });
  } catch (error) {
    console.error("Error in approveDriver:", error);
    res.status(500).json({
      success: false,
      message: "Error approving driver",
      error: error.message,
    });
  }
};

/**
 * @desc    Reject driver registration (Staff only)
 * @route   PATCH /api/users/drivers/:id/reject
 * @access  Staff only
 */
export const rejectDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    if (driver.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This driver has already been processed",
      });
    }

    // Update driver status to rejected
    driver.status = "rejected";
    driver.rejection_reason = rejection_reason || "Does not meet requirements";
    await driver.save();

    // Populate user info
    const updatedDriver = await Driver.findById(driver._id)
      .populate("user", "-password_hash")
      .lean();

    res.status(200).json({
      success: true,
      message: "Driver rejected",
      data: updatedDriver,
    });
  } catch (error) {
    console.error("Error in rejectDriver:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting driver",
      error: error.message,
    });
  }
};

/**
 * @desc    Driver toggles own duty status (available <-> offline)
 * @route   PATCH /api/users/drivers/toggle-duty
 * @access  Driver only
 */
export const toggleDriverDuty = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user._id });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver information not found",
      });
    }

    // Only allow toggling if driver is approved (available or offline)
    if (!["available", "offline"].includes(driver.status)) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot toggle duty shift. Current status: " +
          driver.status,
      });
    }

    // Toggle between available and offline
    driver.status = driver.status === "available" ? "offline" : "available";
    await driver.save();

    const updatedDriver = await Driver.findById(driver._id)
      .populate("user", "-password_hash")
      .lean();

    res.status(200).json({
      success: true,
      message:
        driver.status === "available"
          ? "Started duty shift (On Duty)"
          : "Ended duty shift (Off Duty)",
      data: updatedDriver,
    });
  } catch (error) {
    console.error("Error in toggleDriverDuty:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling duty shift",
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
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

/**
 * @desc    Update user basic info (full_name, phone, avatar_url)
 * @route   PUT /api/users/me
 * @access  Authenticated
 */
export const updateUserInfo = async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    let avatar_url = req.body.avatar_url;

    if (req.file) {
      avatar_url = req.file.path;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update only User fields
    if (full_name) user.full_name = full_name;
    if (phone) user.phone = phone;
    if (avatar_url) user.avatar_url = avatar_url;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(req.user._id)
      .select("-password_hash")
      .lean();

    res.status(200).json({
      success: true,
      message: "Information updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUserInfo:", error);
    res.status(500).json({
      success: false,
      message: "Error updating information",
      error: error.message,
    });
  }
};
