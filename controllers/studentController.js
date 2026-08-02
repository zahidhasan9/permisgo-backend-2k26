import StudentProfile from "../models/StudentProfile.js";
import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Payment from "../models/Payment.js";
import Document from "../models/Document.js";

import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

/**
 * Student profile না থাকলে automatically create করবে।
 * Profile থাকলে existing profile return করবে।
 */
const ensureStudentProfile = async (userId) => {
  const profile = await StudentProfile.findOneAndUpdate(
    { user: userId },

    {
      $setOnInsert: {
        user: userId,
      },
    },

    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return profile;
};

/**
 * Frontend থেকে শুধু allowed profile fields update করতে দেবে।
 * এতে user ইচ্ছামতো অন্য database field পরিবর্তন করতে পারবে না।
 */
const buildProfileUpdate = (body = {}) => {
  const update = {};

  const allowedPersonalFields = [
    "dateOfBirth",
    "gender",
    "address",
    "city",
    "postalCode",
    "nephNumber",
  ];

  allowedPersonalFields.forEach((field) => {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  });

  /**
   * Driving Information
   */
  if (body.drivingInfo && typeof body.drivingInfo === "object") {
    const allowedDrivingFields = [
      "licenseType",
      "currentLevel",
      "preferredVehicleType",
      "previousExperience",
    ];

    allowedDrivingFields.forEach((field) => {
      if (body.drivingInfo[field] !== undefined) {
        update[`drivingInfo.${field}`] = body.drivingInfo[field];
      }
    });
  }

  return update;
};

/**
 * GET /api/students/dashboard
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  /**
   * Profile না থাকলে create হবে।
   * আগে এখানে new: true থাকার কারণে warning আসছিল।
   */
  const profile = await ensureStudentProfile(userId);

  const [bookings, lessons, payments, documents] = await Promise.all([
    Booking.countDocuments({
      student: userId,
    }),

    Lesson.countDocuments({
      student: userId,
    }),

    Payment.countDocuments({
      user: userId,
    }),

    Document.countDocuments({
      user: userId,
    }),
  ]);

  return sendResponse(res, 200, "Student dashboard fetched.", {
    profile,

    stats: {
      bookings,
      lessons,
      payments,
      documents,
    },
  });
});

/**
 * GET /api/students/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  /**
   * নতুন student হলে profile automatically create করবে।
   */
  await ensureStudentProfile(userId);

  const profile = await StudentProfile.findOne({
    user: userId,
  }).populate(
    "user",
    "name email phone avatar role dateOfBirth address city country",
  );

  if (!profile) {
    throw new ApiError(404, "Student profile not found.");
  }

  return sendResponse(res, 200, "Student profile fetched.", profile);
});

/**
 * PATCH /api/students/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const updateData = buildProfileUpdate(req.body);

  const updateOperation = {
    $setOnInsert: {
      user: userId,
    },
  };

  /**
   * কোনো valid field থাকলেই $set যোগ হবে।
   */
  if (Object.keys(updateData).length > 0) {
    updateOperation.$set = updateData;
  }

  const profile = await StudentProfile.findOneAndUpdate(
    {
      user: userId,
    },

    updateOperation,

    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  ).populate(
    "user",
    "name email phone avatar role dateOfBirth address city country",
  );

  return sendResponse(res, 200, "Student profile updated.", profile);
});

/**
 * PATCH /api/students/favorite-teachers/:teacherId
 */
export const addFavoriteTeacher = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { teacherId } = req.params;

  const profile = await StudentProfile.findOneAndUpdate(
    {
      user: userId,
    },

    {
      $addToSet: {
        favoriteTeachers: teacherId,
      },

      $setOnInsert: {
        user: userId,
      },
    },

    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return sendResponse(res, 200, "Teacher added to favorites.", profile);
});

/**
 * DELETE /api/students/favorite-teachers/:teacherId
 */
export const removeFavoriteTeacher = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { teacherId } = req.params;

  const profile = await StudentProfile.findOneAndUpdate(
    {
      user: userId,
    },

    {
      $pull: {
        favoriteTeachers: teacherId,
      },
    },

    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!profile) {
    throw new ApiError(404, "Student profile not found.");
  }

  return sendResponse(res, 200, "Teacher removed from favorites.", profile);
});
