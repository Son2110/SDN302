import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split("")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password_hash");
      next();
    } catch (error) {
      res.status(401).json({ message: "Token is invalid or expired" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "You must login first!" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    next();
  };
};
