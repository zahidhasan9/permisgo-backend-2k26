import StudentProfile from "../models/StudentProfile";
import Booking from "../models/Booking";
import Lesson from "../models/Lesson";
import Payment from "../models/Payment";
import Document from "../models/Document";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const getDashboard = asyncHandler(async (req, res) => {
  const [profile, bookings, lessons, payments, documents] = await Promise.all([
    StudentProfile.findOne({ user: req.user._id }),
    Booking.countDocuments({ student: req.user._id }),
    Lesson.countDocuments({ student: req.user._id }),
    Payment.countDocuments({ user: req.user._id }),
    Document.countDocuments({ user: req.user._id }),
  ]);

  sendResponse(res, 200, "Student dashboard fetched.", {
    profile,
    stats: { bookings, lessons, payments, documents },
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id }).populate(
    "user",
    "name email phone avatar",
  );
  if (!profile) throw new ApiError(404, "Student profile not found.");
  sendResponse(res, 200, "Student profile fetched.", profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user._id },
    req.body,
    { new: true, runValidators: true },
  );
  if (!profile) throw new ApiError(404, "Student profile not found.");
  sendResponse(res, 200, "Student profile updated.", profile);
});

export const addFavoriteTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { favoriteTeachers: teacherId } },
    { new: true },
  );
  sendResponse(res, 200, "Teacher added to favorites.", profile);
});

export const removeFavoriteTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { favoriteTeachers: teacherId } },
    { new: true },
  );
  sendResponse(res, 200, "Teacher removed from favorites.", profile);
});
