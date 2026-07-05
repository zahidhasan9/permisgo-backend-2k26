import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Payment from "../models/Payment.js";
import SupportTicket from "../models/SupportTicket.js";
import TeacherProfile from "../models/TeacherProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const [
    students,
    teachers,
    bookings,
    lessons,
    payments,
    supportTickets,
    pendingTeachers,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "teacher" }),
    Booking.countDocuments(),
    Lesson.countDocuments(),
    Payment.countDocuments({ status: "success" }),
    SupportTicket.countDocuments({ status: { $ne: "closed" } }),
    TeacherProfile.countDocuments({ verificationStatus: "pending" }),
  ]);

  sendResponse(res, 200, "Admin dashboard fetched.", {
    students,
    teachers,
    bookings,
    lessons,
    payments,
    supportTickets,
    pendingTeachers,
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, "Users fetched.", users);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true },
  ).select("-password");
  if (!user) throw new ApiError(404, "User not found.");
  sendResponse(res, 200, "User status updated.", user);
});

export const verifyTeacher = asyncHandler(async (req, res) => {
  const profile = await TeacherProfile.findOneAndUpdate(
    { user: req.params.teacherId },
    { verificationStatus: req.body.verificationStatus || "verified" },
    { new: true },
  );
  if (!profile) throw new ApiError(404, "Teacher profile not found.");
  sendResponse(res, 200, "Teacher verification status updated.", profile);
});
