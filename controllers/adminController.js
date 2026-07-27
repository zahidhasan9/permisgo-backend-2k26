// import User from "../models/User.js";
// import Booking from "../models/Booking.js";
// import Lesson from "../models/Lesson.js";
// import Payment from "../models/Payment.js";
// import SupportTicket from "../models/SupportTicket.js";
// import TeacherProfile from "../models/TeacherProfile.js";
// import asyncHandler from "../utils/asyncHandler.js";
// import sendResponse from "../utils/ApiResponse.js";

import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Payment from "../models/Payment.js";
import SupportTicket from "../models/SupportTicket.js";
import TeacherProfile from "../models/TeacherProfile.js";
import StudentProfile from "../models/StudentProfile.js";
import Document from "../models/Document.js";

import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";

const allowedRoles = ["student", "teacher", "admin"];
const allowedStatuses = ["active", "inactive", "blocked"];
const allowedVerificationStatuses = ["pending", "verified", "rejected"];

const fail = (res, statusCode, message) => {
  res.status(statusCode);
  throw new Error(message);
};

const getCurrentUserId = (req) => {
  return String(req.user?._id || req.user?.id || req.userId || "");
};

// @desc    Admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Admin
export const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    activeUsers,
    blockedUsers,
    totalBookings,
    completedLessons,
    totalRevenue,
    openTickets,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "teacher" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "blocked" }),
    Booking.countDocuments(),
    Lesson.countDocuments({ status: "completed" }),
    Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    SupportTicket.countDocuments({ status: { $ne: "closed" } }),
  ]);

  const dashboard = {
    users: {
      total: totalUsers,
      students: totalStudents,
      teachers: totalTeachers,
      admins: totalAdmins,
      active: activeUsers,
      blocked: blockedUsers,
    },
    business: {
      bookings: totalBookings,
      completedLessons,
      revenue: totalRevenue?.[0]?.total || 0,
      openTickets,
    },
  };

  return sendResponse(
    res,
    200,
    "Admin dashboard fetched successfully.",
    dashboard,
  );
});

// @desc    Get all users with filter/search/pagination
// @route   GET /api/admin/users
// @access  Admin
export const getUsers = asyncHandler(async (req, res) => {
  const {
    search = "",
    role = "all",
    status = "all",
    page = 1,
    limit = 20,
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};

  if (search.trim()) {
    const keyword = search.trim();

    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
    ];
  }

  if (role !== "all") {
    if (!allowedRoles.includes(role)) {
      return fail(res, 400, "Invalid role filter.");
    }

    filter.role = role;
  }

  if (status !== "all") {
    if (!allowedStatuses.includes(status)) {
      return fail(res, 400, "Invalid status filter.");
    }

    filter.status = status;
  }

  const [users, filteredTotal, statusSummary] = await Promise.all([
    User.find(filter)
      // avatar is included because only password is excluded
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),

    User.countDocuments(filter),

    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ["$status", "inactive"] }, 1, 0],
            },
          },
          blocked: {
            $sum: {
              $cond: [{ $eq: ["$status", "blocked"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          active: 1,
          inactive: 1,
          blocked: 1,
        },
      },
    ]),
  ]);

  const stats = statusSummary[0] || {
    total: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
  };

  return sendResponse(res, 200, "Users fetched successfully.", users, {
    page: pageNumber,
    limit: limitNumber,
    total: filteredTotal,
    totalPages: Math.ceil(filteredTotal / limitNumber) || 1,
    stats,
  });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -resetPasswordToken -resetPasswordExpire")
    .lean();

  if (!user) {
    return fail(res, 404, "User not found.");
  }

  const profileQuery =
    user.role === "teacher"
      ? TeacherProfile.findOne({ user: user._id }).lean()
      : user.role === "student"
        ? StudentProfile.findOne({ user: user._id }).lean()
        : Promise.resolve(null);

  const [profile, documents] = await Promise.all([
    profileQuery,
    Document.find({ user: user._id })
      .select(
        "title requirementKey type documentSide originalFileName fileUrl fileType fileSize status rejectionReason version uploadedAt reviewedAt createdAt updatedAt",
      )
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return sendResponse(res, 200, "User fetched successfully.", {
    ...user,
    profile,
    documents,
  });
});

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Admin
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    return fail(res, 400, "Invalid status. Use active, inactive, or blocked.");
  }

  const targetUserId = String(req.params.id);
  const currentUserId = getCurrentUserId(req);

  if (targetUserId === currentUserId && status !== "active") {
    return fail(
      res,
      400,
      "You cannot deactivate or block your own admin account.",
    );
  }

  const user = await User.findByIdAndUpdate(
    targetUserId,
    { status },
    { new: true, runValidators: true },
  ).select("-password");

  if (!user) {
    return fail(res, 404, "User not found.");
  }

  return sendResponse(res, 200, "User status updated successfully.", user);
});

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Admin
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!allowedRoles.includes(role)) {
    return fail(res, 400, "Invalid role. Use student, teacher, or admin.");
  }

  const targetUserId = String(req.params.id);
  const currentUserId = getCurrentUserId(req);

  if (targetUserId === currentUserId && role !== "admin") {
    return fail(
      res,
      400,
      "You cannot remove admin role from your own account.",
    );
  }

  const user = await User.findByIdAndUpdate(
    targetUserId,
    { role },
    { new: true, runValidators: true },
  ).select("-password");

  if (!user) {
    return fail(res, 404, "User not found.");
  }

  return sendResponse(res, 200, "User role updated successfully.", user);
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const targetUserId = String(req.params.id);
  const currentUserId = getCurrentUserId(req);

  if (targetUserId === currentUserId) {
    return fail(res, 400, "You cannot delete your own admin account.");
  }

  const user = await User.findByIdAndDelete(targetUserId);

  if (!user) {
    return fail(res, 404, "User not found.");
  }

  return sendResponse(res, 200, "User deleted successfully.", {
    deletedUserId: targetUserId,
  });
});

// @desc    Verify/reject teacher profile
// @route   PATCH /api/admin/teachers/:teacherId/verify
// @access  Admin
export const verifyTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const { verificationStatus, rejectionReason = "" } = req.body;

  if (!allowedVerificationStatuses.includes(verificationStatus)) {
    return fail(res, 400, "Invalid verification status.");
  }

  const teacherProfile = await TeacherProfile.findOneAndUpdate(
    { user: teacherId },
    {
      verificationStatus,
      rejectionReason: verificationStatus === "rejected" ? rejectionReason : "",
    },
    { new: true, runValidators: true },
  ).populate("user", "name email phone role status");

  if (!teacherProfile) {
    return fail(res, 404, "Teacher profile not found.");
  }

  return sendResponse(
    res,
    200,
    "Teacher verification status updated successfully.",
    teacherProfile,
  );
});

export default {};
