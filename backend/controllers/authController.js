import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Customer } from "../models/user.model.js";

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
    if (userExists) return res.status(400).json({ message: "Email is used" });

    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassowrd = await bcrypt.hash(password, salt);

    //create user
    const newUser = await User.create({
      email,
      password_hash: hashedPassowrd,
      full_name,
      phone,
    });

    //create customer
    await Customer.create({
        user: newUser._id,
        id_card: id_card || 'DEFAULT_ID',     
    })
    res.status(201).json({
        success:  true,
        _id: newUser._id,
        email: newUser.email,
        token: generateToken(newUser._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message})
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //find user
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      res.json({
        success: true,
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        token: generateToken(user._id),
      });
    } else res.status(401).json({ message: "Wrong email or password" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.status(200).json(req.user);
};
