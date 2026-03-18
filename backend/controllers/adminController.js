import { User, Customer, Driver, Staff, Admin } from "../models/user.model.js";
import { Payment } from "../models/finance.model.js";
import { Booking } from "../models/booking.model.js";
import { getUserRoles } from "../middlewares/authMiddleware.js";

// ==================== REVENUE STATS ====================
// @route GET /api/admin/revenue?year=2026
// @access Admin only
export const getRevenueStats = async (req, res) => {
  try {
    let year = parseInt(req.query.year) || new Date().getFullYear();
    if (isNaN(year) || year < 2020 || year > 2100) {
      year = new Date().getFullYear();
    }
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    // Monthly revenue for selected year
    const monthly = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          payment_date: { $gte: startOfYear, $lt: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$payment_date" },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue breakdown by payment_type (all time)
    const byType = await Payment.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$payment_type",
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Overall totals (all time)
    const overallAgg = await Payment.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);
    const overall = overallAgg[0] || { totalRevenue: 0, totalTransactions: 0 };

    // Year totals
    const yearAgg = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          payment_date: { $gte: startOfYear, $lt: endOfYear },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);
    const yearTotals = yearAgg[0] || { revenue: 0, count: 0 };

    // Booking + user counts
    const [
      totalBookings,
      completedBookings,
      totalUsers,
      totalCustomers,
      totalDriversActive,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "completed" }),
      User.countDocuments({ is_active: true }),
      Customer.countDocuments(),
      Driver.countDocuments({ status: { $in: ["available", "busy"] } }),
    ]);

    return res.json({
      success: true,
      data: {
        year,
        monthly: monthly.map((m) => ({
          month: m._id,
          revenue: m.revenue,
          count: m.count,
        })),
        byType: byType.map((t) => ({
          type: t._id,
          revenue: t.revenue,
          count: t.count,
        })),
        yearRevenue: yearTotals.revenue,
        yearTransactions: yearTotals.count,
        totalRevenue: overall.totalRevenue,
        totalTransactions: overall.totalTransactions,
        totalBookings,
        completedBookings,
        totalUsers,
        totalCustomers,
        totalDriversActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== LIST ALL USERS ====================
// @route GET /api/admin/users?page=1&limit=20&search=
// @access Admin only
export const getAllUsersAdmin = async (req, res) => {
  try {
    let { page = 1, limit = 20, search = "" } = req.query;

    // Clamp pagination
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit) || 20));

    let query = {};
    if (search) {
      query = {
        $or: [
          { full_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password_hash")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    const userIds = users.map((u) => u._id);

    // Batch-fetch role records for these users
    const [customers, drivers, staffs, admins] = await Promise.all([
      Customer.find({ user: { $in: userIds } })
        .select("user")
        .lean(),
      Driver.find({ user: { $in: userIds } })
        .select("user status")
        .lean(),
      Staff.find({ user: { $in: userIds } })
        .select("user employee_id department position")
        .lean(),
      Admin.find({ user: { $in: userIds } })
        .select("user")
        .lean(),
    ]);

    const customerSet = new Set(customers.map((c) => c.user.toString()));
    const driverMap = new Map(
      drivers.map((d) => [d.user.toString(), d.status]),
    );
    const staffSet = new Set(staffs.map((s) => s.user.toString()));
    const adminSet = new Set(admins.map((a) => a.user.toString()));

    const enriched = users.map((u) => {
      const id = u._id.toString();
      const roles = [];
      if (customerSet.has(id)) roles.push("customer");
      if (driverMap.has(id)) roles.push("driver");
      if (staffSet.has(id)) roles.push("staff");
      if (adminSet.has(id)) roles.push("admin");
      return { ...u, roles };
    });

    return res.json({
      success: true,
      data: enriched,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== UPDATE USER ROLE ====================
// @route PATCH /api/admin/users/:userId/role
// @body  { role: "admin"|"staff", action: "add"|"remove" }
// @access Admin only
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, action } = req.body;

    if (!["admin", "staff"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể chỉnh role 'admin' hoặc 'staff'",
      });
    }
    if (!["add", "remove"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action phải là 'add' hoặc 'remove'",
      });
    }

    // Prevent self-demoting admin
    if (
      role === "admin" &&
      action === "remove" &&
      req.user._id.toString() === userId
    ) {
      return res.status(400).json({
        success: false,
        message: "Không thể tự xóa quyền admin của chính mình",
      });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });

    // Bảo vệ Super Admin (admin@luxedrive.com)
    if (user.email === "admin@luxedrive.com") {
      return res.status(403).json({
        success: false,
        message: "Không thể thay đổi quyền của Administrator mặc định.",
      });
    }

    if (role === "admin") {
      if (action === "add") {
        const exists = await Admin.exists({ user: userId });
        if (!exists) await Admin.create({ user: userId });
      } else {
        await Admin.deleteOne({ user: userId });
      }
    } else if (role === "staff") {
      if (action === "add") {
        const exists = await Staff.exists({ user: userId });
        if (!exists) {
          await Staff.create({
            user: userId,
            employee_id: `EMP${Date.now()}`,
            department: "General",
            position: "Staff",
            hire_date: new Date(),
          });
        }
      } else {
        await Staff.deleteOne({ user: userId });
      }
    }

    const updatedRoles = await getUserRoles(userId);
    return res.json({
      success: true,
      message: "Cập nhật role thành công",
      roles: updatedRoles,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== TOGGLE USER ACTIVE STATUS ====================
// @route PATCH /api/admin/users/:userId/status
// @access Admin only
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Không thể vô hiệu hóa tài khoản của chính mình",
      });
    }

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });

    user.is_active = !user.is_active;
    await user.save();

    return res.json({
      success: true,
      message: `Tài khoản đã được ${user.is_active ? "kích hoạt" : "vô hiệu hóa"}`,
      is_active: user.is_active,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
