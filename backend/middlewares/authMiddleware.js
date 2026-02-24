import jwt from "jsonwebtoken";
import { User, Customer, Driver, Staff } from "../models/user.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // 1. Lấy thông tin user gốc
      const user = await User.findById(decoded.id)
        .select("-password_hash")
        .lean();

      if (!user) {
        return res.status(401).json({ message: "User is not existed" });
      }

      // 2. Tìm roles
      const roles = await getUserRoles(user._id);
      // 3. Gắn vào req.user để các controller và middleware sau dùng
      req.user = {
        ...user,
        roles, // Bây giờ req.user.roles là 1 mảng. VD: ['customer', 'driver']
      };

      next(); // Cho đi tiếp
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "You are not login!" });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to do this!",
      });
    }
    next();
  };
};

export const getUserRoles = async (userId) => {
  const [isCustomer, isDriver, isStaff] = await Promise.all([
    Customer.exists({ user: userId }),
    Driver.exists({ user: userId }),
    Staff.exists({ user: userId }),
  ]);

  const roles = [];
  if (isCustomer) roles.push("customer");
  if (isDriver) roles.push("driver");
  if (isStaff) roles.push("staff");

  return roles;
};
