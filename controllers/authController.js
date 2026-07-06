import crypto from "crypto";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Referral from "../models/Referral.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (!name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ?? "",
      password: hashedPassword,
    });

    let referralCode;
    let referralExists = true;

    while (referralExists) {
      const prefix =
        name
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 3)
          .toUpperCase() || "PG";

      referralCode = `${prefix}${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;

      referralExists = await Referral.findOne({ referralCode });
    }

    await Referral.create({
      user: user._id,
      referralCode,
    });

    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const safeUser = await User.findById(user._id).select("-password");

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        user: {
          id: safeUser._id,
          _id: safeUser._id,
          name: safeUser.name,
          email: safeUser.email,
          phone: safeUser.phone || "",
          role: safeUser.role,
          status: safeUser.status,
          isEmailVerified: safeUser.isEmailVerified,
          isPhoneVerified: safeUser.isPhoneVerified,
          lastLoginAt: safeUser.lastLoginAt,
          createdAt: safeUser.createdAt,
          updatedAt: safeUser.updatedAt,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed.",
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.status === "blocked" || user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active. Please contact support.",
      });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken({
      id: user._id,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const safeUser = await User.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: safeUser._id,
          _id: safeUser._id,
          name: safeUser.name,
          email: safeUser.email,
          phone: safeUser.phone || "",
          role: safeUser.role,
          status: safeUser.status,
          isEmailVerified: safeUser.isEmailVerified,
          isPhoneVerified: safeUser.isPhoneVerified,
          lastLoginAt: safeUser.lastLoginAt,
          createdAt: safeUser.createdAt,
          updatedAt: safeUser.updatedAt,
        },
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed.",
    });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const me = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    console.log("User ID from token:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current user fetched.",
      data: {
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user.",
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private/Public
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed.",
    });
  }
};

// @desc    Update current user profile
// @route   PATCH /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = name.trim();
    }

    user.phone = phone ?? user.phone;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: {
          id: updatedUser._id,
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone || "",
          role: updatedUser.role,
          status: updatedUser.status,
          isEmailVerified: updatedUser.isEmailVerified,
          isPhoneVerified: updatedUser.isPhoneVerified,
          lastLoginAt: updatedUser.lastLoginAt,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

// @desc    Change current user password
// @route   PATCH /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to change password.",
    });
  }
};

export default {
  register,
  login,
  logout,
};
