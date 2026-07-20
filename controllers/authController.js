import crypto from "crypto";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Referral from "../models/Referral.js";

import generateToken from "../utils/generateToken.js";

import {
  deleteStoredFile,
  getUploadedFileUrl,
} from "../utils/uploadHelpers.js";

const safeUserPayload = (user) => {
  if (!user) return null;

  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    avatar: user.avatar || "",
    designation: user.designation || "",
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth || null,
    address: user.address || "",
    city: user.city || "",
    country: user.country || "",
    language: user.language || "",
    bio: user.bio || "",
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const setStringField = (user, field, value, maxLength = 200) => {
  if (value === undefined) return;

  const cleanValue = String(value || "").trim();

  user[field] = cleanValue.slice(0, maxLength);
};

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role = "student" } = req.body;

    const cleanName = String(name || "").trim();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const cleanPhone = String(phone || "").trim();

    const normalizedRole = String(role || "student")
      .trim()
      .toLowerCase();

    // Public registration থেকে admin account তৈরি করা যাবে না।
    const allowedRoles = ["student", "teacher"];

    if (!cleanName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either student or teacher.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: cleanName,
      email: normalizedEmail,
      phone: cleanPhone,
      password: hashedPassword,

      // গুরুত্বপূর্ণ পরিবর্তন
      role: normalizedRole,
    });

    let referralCode;
    let referralExists = true;

    while (referralExists) {
      const prefix =
        cleanName
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 3)
          .toUpperCase() || "PG";

      referralCode = `${prefix}${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;

      referralExists = await Referral.findOne({
        referralCode,
      });
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
      message:
        normalizedRole === "teacher"
          ? "Teacher registration successful."
          : "Student registration successful.",
      data: {
        user: safeUserPayload(safeUser),
        token,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed.",
    });
  }
};

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
        user: safeUserPayload(safeUser),
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

export const me = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

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
        user: safeUserPayload(user),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user.",
    });
  }
};

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

export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      designation,
      gender,
      dateOfBirth,
      address,
      city,
      country,
      language,
      bio,
    } = req.body;

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
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      user.name = String(name).trim().slice(0, 100);
    }

    setStringField(user, "phone", phone, 30);
    setStringField(user, "designation", designation, 100);
    setStringField(user, "address", address, 250);
    setStringField(user, "city", city, 100);
    setStringField(user, "country", country, 100);
    setStringField(user, "language", language, 100);
    setStringField(user, "bio", bio, 500);

    if (gender !== undefined) {
      const cleanGender = String(gender || "")
        .trim()
        .toLowerCase();

      if (!["", "male", "female", "other"].includes(cleanGender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender value.",
        });
      }

      user.gender = cleanGender;
    }

    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    let oldAvatarToDelete = "";

    if (req.file) {
      const newAvatarUrl = getUploadedFileUrl(req.file);

      if (!newAvatarUrl) {
        throw new Error("Uploaded profile image URL could not be created.");
      }

      oldAvatarToDelete = user.avatar || "";
      user.avatar = newAvatarUrl;
    }

    /*
    আগে database save হবে।
    Save সফল হলে পুরোনো image delete হবে।
    */
    const updatedUser = await user.save();

    if (oldAvatarToDelete && oldAvatarToDelete !== updatedUser.avatar) {
      await deleteStoredFile(oldAvatarToDelete);
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: safeUserPayload(updatedUser),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

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

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save({ validateBeforeSave: false });

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
  me,
  logout,
  updateProfile,
  changePassword,
};
