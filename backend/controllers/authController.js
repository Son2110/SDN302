import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Customer } from "../models/user.model.js";
import { getUserRoles } from "../middlewares/authMiddleware.js";
import { sendEmail } from "../utils/emailSender.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const register = async (req, res) => {
  try {
    const { email, password, full_name, phone, id_card } = req.body;

    const userExists = await User.findOne({ email });
    //check mail
    if (userExists)
      return res.status(400).json({ message: "Email này đã được sử dụng" });

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create user
    const newUser = await User.create({
      email,
      password_hash: hashedPassword,
      full_name,
      phone,
    });

    //create customer
    await Customer.create({
      user: newUser._id,
      id_card: id_card || "DEFAULT_ID",
    });
    res.status(201).json({
      success: true,
      _id: newUser._id,
      email: newUser.email,
      token: generateToken(newUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //find user
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const roles = await getUserRoles(user._id);
      res.json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
          full_name: user.full_name,
          roles: roles,
        },
        token: generateToken(user._id),
      });
    } else res.status(401).json({ message: "Sai email hoặc mật khẩu" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        _id: req.user._id,
        email: req.user.email,
        full_name: req.user.full_name,
        roles: req.user.roles,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.reset_password_otp = otp;
    user.reset_password_otp_expires = expires;
    await user.save();

    const subject = "Password Reset Request - LuxeDrive";
    const text = `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`;
    const html = `
      <h3>Password Reset Request</h3>
      <p>You requested a password reset for your LuxeDrive account.</p>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP expires in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail(email, subject, text, html);

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      reset_password_otp: otp,
      reset_password_otp_expires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password_hash = hashedPassword;
    user.reset_password_otp = undefined;
    user.reset_password_otp_expires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
