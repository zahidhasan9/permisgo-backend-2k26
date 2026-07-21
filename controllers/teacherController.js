import mongoose from "mongoose";
import TeacherLocation from "../models/TeacherLocation.js";
import TeacherProfile from "../models/TeacherProfile.js";
import TeacherVehicle from "../models/TeacherVehicle.js";
import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Document from "../models/Document.js";
import TeacherAvailability from "../models/TeacherAvailability.js";
import User from "../models/User.js";

import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  ACTIVE_BOOKING_STATUSES,
  getUtcDayRange,
  hasOccupiedConflict,
  isTimeInsideWorkingSlots,
  normalizeTime,
} from "../utils/bookingAvailability.js";

export const getPublicTeachers = asyncHandler(async (req, res) => {
  const vehicleType = ["manual", "automatic", "electric"].includes(
    req.query.vehicleType,
  )
    ? req.query.vehicleType
    : "";
  const hasSlotFilter = req.query.date && req.query.startTime && req.query.endTime;
  const startTime = hasSlotFilter
    ? normalizeTime(req.query.startTime, "Start time")
    : "";
  const endTime = hasSlotFilter
    ? normalizeTime(req.query.endTime, "End time")
    : "";
  const dateRange = hasSlotFilter ? getUtcDayRange(req.query.date) : null;

  const teachers = await TeacherProfile.find({
    verificationStatus: "verified",
    availabilityStatus: "available",
  })
    .populate({
      path: "user",
      match: {
        status: "active",
        role: "teacher",
      },
      select: "name email phone avatar city address bio",
    })
    .populate({
      path: "vehicles",
      match: {
        status: "active",
        approvalStatus: "approved",
        ...(vehicleType ? { vehicleType } : {}),
      },
      select:
        "vehicleName vehicleType brand model modelYear vehicleImage isDefault approvalStatus status",
    })
    .populate({
      path: "locations",
      match: {
        status: "active",
      },
      select: "title address city postalCode coordinates status",
    })
    .sort({
      "rating.average": -1,
      experienceYears: -1,
    })
    .lean();

  let availableTeachers = teachers.filter(
    (teacher) => teacher.user && teacher.vehicles?.length && teacher.locations?.length,
  );

  if (dateRange && availableTeachers.length) {
    const teacherIds = availableTeachers.map((teacher) => teacher.user._id);
    const [availabilities, bookings] = await Promise.all([
      TeacherAvailability.find({ teacher: { $in: teacherIds } }).lean(),
      Booking.find({
        teacher: { $in: teacherIds },
        bookingDate: { $gte: dateRange.start, $lte: dateRange.end },
        status: { $in: ACTIVE_BOOKING_STATUSES },
      })
        .select("teacher startTime endTime")
        .lean(),
    ]);
    const availabilityByTeacher = new Map(
      availabilities.map((item) => [String(item.teacher), item]),
    );
    const bookingsByTeacher = new Map();
    bookings.forEach((booking) => {
      const key = String(booking.teacher);
      bookingsByTeacher.set(key, [...(bookingsByTeacher.get(key) || []), booking]);
    });
    availableTeachers = availableTeachers.filter((teacher) => {
      const teacherId = String(teacher.user._id);
      const availability = availabilityByTeacher.get(teacherId);
      return (
        isTimeInsideWorkingSlots({
          availability,
          bookingDate: dateRange.date,
          startTime,
          endTime,
        }) &&
        !hasOccupiedConflict({
          startTime,
          endTime,
          occupiedSlots: bookingsByTeacher.get(teacherId) || [],
          bufferMinutes: availability?.bufferMinutes || 0,
        })
      );
    });
  }

  sendResponse(
    res,
    200,
    "Available teachers fetched successfully.",
    availableTeachers,
  );
});

export const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now);
  const todayEnd = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    profile,
    todayLessons,
    pendingBookings,
    todayLessonCount,
    pendingBookingCount,
    upcomingCount,
    completedCount,
    actionCount,
    activeStudents,
    monthCompletedLessons,
    approvedVehicles,
    activeLocations,
    availability,
    approvedDocuments,
  ] = await Promise.all([
    TeacherProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email phone avatar",
    ),
    Lesson.find({
      teacher: req.user._id,
      lessonDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ["scheduled", "in_progress", "awaiting_confirmation"] },
    })
      .sort({ startTime: 1 })
      .limit(5)
      .populate("student", "name email phone avatar")
      .populate("booking"),
    Booking.find({ teacher: req.user._id, status: "pending" })
      .sort({ bookingDate: 1, startTime: 1 })
      .limit(5)
      .populate("student", "name email phone avatar"),
    Lesson.countDocuments({
      teacher: req.user._id,
      lessonDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ["scheduled", "in_progress", "awaiting_confirmation"] },
    }),
    Booking.countDocuments({ teacher: req.user._id, status: "pending" }),
    Lesson.countDocuments({
      teacher: req.user._id,
      status: "scheduled",
      lessonDate: { $gte: todayStart },
    }),
    Lesson.countDocuments({ teacher: req.user._id, status: "completed" }),
    Lesson.countDocuments({
      teacher: req.user._id,
      status: { $in: ["in_progress", "awaiting_confirmation"] },
    }),
    Lesson.distinct("student", {
      teacher: req.user._id,
      status: { $in: ["scheduled", "in_progress", "awaiting_confirmation"] },
    }),
    Lesson.find({
      teacher: req.user._id,
      status: "completed",
      completedAt: { $gte: monthStart, $lte: now },
    }).populate("booking", "pricingSnapshot"),
    TeacherVehicle.countDocuments({
      teacher: req.user._id,
      approvalStatus: "approved",
      status: "active",
    }),
    TeacherLocation.countDocuments({
      teacher: req.user._id,
      status: "active",
    }),
    TeacherAvailability.findOne({ teacher: req.user._id }).lean(),
    Document.countDocuments({
      user: req.user._id,
      status: "approved",
    }),
  ]);

  const monthlyEarnings = monthCompletedLessons.reduce(
    (sum, lesson) =>
      sum + Number(lesson.booking?.pricingSnapshot?.subtotal || 0),
    0,
  );
  const readiness = {
    profile: Boolean(
      profile?.user?.name &&
        profile?.user?.phone &&
        profile?.qualification &&
        profile?.bio,
    ),
    verified: profile?.verificationStatus === "verified",
    vehicle: approvedVehicles > 0,
    location: activeLocations > 0,
    availability: Boolean(
      availability?.weeklySchedule?.some(
        (day) => day.enabled && day.slots?.length,
      ),
    ),
    documents: approvedDocuments > 0,
  };
  const completedReadiness = Object.values(readiness).filter(Boolean).length;

  sendResponse(res, 200, "Teacher dashboard fetched successfully.", {
    profile,
    stats: {
      todayLessons: todayLessonCount,
      pendingBookings: pendingBookingCount,
      upcomingLessons: upcomingCount,
      completedLessons: completedCount,
      actionRequired: actionCount,
      activeStudents: activeStudents.length,
      monthlyEarnings: Number(monthlyEarnings.toFixed(2)),
      rating: profile?.rating?.average || 0,
    },
    todayLessons,
    pendingBookings,
    readiness: {
      items: readiness,
      completed: completedReadiness,
      total: Object.keys(readiness).length,
      percentage: Math.round(
        (completedReadiness / Object.keys(readiness).length) * 100,
      ),
    },
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  let profile = await TeacherProfile.findOne({
    user: req.user._id,
  });

  // TeacherProfile না থাকলে স্বয়ংক্রিয়ভাবে তৈরি হবে
  if (!profile) {
    profile = await TeacherProfile.create({
      user: req.user._id,
    });
  }

  const populatedProfile = await TeacherProfile.findById(profile._id)
    .populate(
      "user",
      [
        "name",
        "email",
        "phone",
        "avatar",
        "designation",
        "gender",
        "dateOfBirth",
        "address",
        "city",
        "country",
        "language",
        "bio",
      ].join(" "),
    )
    .populate("vehicles locations documents");

  sendResponse(
    res,
    200,
    "Teacher profile fetched successfully.",
    populatedProfile,
  );
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "bio",
    "experienceYears",
    "qualification",
    "lessonTypes",
    "hourlyRate",
    "availabilityStatus",
  ];

  const updateData = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  if (
    updateData.lessonTypes !== undefined &&
    !Array.isArray(updateData.lessonTypes)
  ) {
    throw new ApiError(400, "Lesson types must be an array.");
  }

  if (updateData.lessonTypes !== undefined) {
    const allowedLessonTypes = [
      "manual",
      "automatic",
      "code",
      "accompanied",
      "accelerated",
    ];
    updateData.lessonTypes = [
      ...new Set(updateData.lessonTypes.map((item) => String(item).trim())),
    ];
    if (
      updateData.lessonTypes.length > allowedLessonTypes.length ||
      updateData.lessonTypes.some((item) => !allowedLessonTypes.includes(item))
    ) {
      throw new ApiError(400, "One or more lesson types are invalid.");
    }
  }

  if (updateData.experienceYears !== undefined) {
    const experienceYears = Number(updateData.experienceYears);

    if (
      !Number.isFinite(experienceYears) ||
      experienceYears < 0 ||
      experienceYears > 80
    ) {
      throw new ApiError(
        400,
        "Experience years must be between 0 and 80.",
      );
    }

    updateData.experienceYears = experienceYears;
  }

  if (updateData.hourlyRate !== undefined) {
    const hourlyRate = Number(updateData.hourlyRate);

    if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 10000) {
      throw new ApiError(400, "Hourly rate must be between 0 and 10000.");
    }

    updateData.hourlyRate = hourlyRate;
  }

  if (updateData.availabilityStatus !== undefined) {
    if (!["available", "unavailable"].includes(updateData.availabilityStatus)) {
      throw new ApiError(400, "Invalid booking availability status.");
    }
  }

  if (updateData.qualification !== undefined) {
    updateData.qualification = String(updateData.qualification).trim();
    if (updateData.qualification.length > 200) {
      throw new ApiError(400, "Qualification cannot exceed 200 characters.");
    }
  }

  if (updateData.bio !== undefined) {
    updateData.bio = String(updateData.bio).trim();
    if (updateData.bio.length > 500) {
      throw new ApiError(400, "Teacher bio cannot exceed 500 characters.");
    }
  }

  const profile = await TeacherProfile.findOneAndUpdate(
    {
      user: req.user._id,
    },
    {
      $set: updateData,
      $setOnInsert: {
        user: req.user._id,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  )
    .populate(
      "user",
      [
        "name",
        "email",
        "phone",
        "avatar",
        "designation",
        "gender",
        "dateOfBirth",
        "address",
        "city",
        "country",
        "language",
        "bio",
      ].join(" "),
    )
    .populate("vehicles locations documents");

  sendResponse(res, 200, "Teacher profile updated successfully.", profile);
});

export const getMyStudents = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const search = String(req.query.search || "").trim().slice(0, 80);

  const [lessonStudentIds, bookingStudentIds] = await Promise.all([
    Lesson.distinct("student", { teacher: req.user._id }),
    Booking.distinct("student", { teacher: req.user._id }),
  ]);
  const studentIds = [
    ...new Set(
      [...lessonStudentIds, ...bookingStudentIds].map((value) => String(value)),
    ),
  ].map((value) => new mongoose.Types.ObjectId(value));

  const userFilter = { _id: { $in: studentIds }, role: "student" };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    userFilter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  ["name", "email", "phone"].forEach((field) => {
    const value = String(req.query[field] || "").trim().slice(0, 80);
    if (value) {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      userFilter[field] = new RegExp(escaped, "i");
    }
  });

  const [users, total] = await Promise.all([
    User.find(userFilter)
      .select("name email phone avatar status")
      .sort({ name: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(userFilter),
  ]);
  const pageIds = users.map((user) => user._id);

  const [lessonRows, pendingRows, latestBookings] = await Promise.all([
    Lesson.aggregate([
      { $match: { teacher: req.user._id, student: { $in: pageIds } } },
      {
        $group: {
          _id: "$student",
          totalLessons: {
            $sum: {
              $cond: [{ $in: ["$status", ["cancelled", "no_show"]] }, 0, 1],
            },
          },
          completedLessons: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          activeLessons: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["scheduled", "in_progress", "awaiting_confirmation"],
                  ],
                },
                1,
                0,
              ],
            },
          },
          noShows: { $sum: { $cond: [{ $eq: ["$status", "no_show"] }, 1, 0] } },
          lastLessonAt: { $max: "$lessonDate" },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          teacher: req.user._id,
          student: { $in: pageIds },
          status: "pending",
        },
      },
      { $group: { _id: "$student", count: { $sum: 1 } } },
    ]),
    Booking.find({ teacher: req.user._id, student: { $in: pageIds } })
      .sort({ bookingDate: -1, createdAt: -1 })
      .populate("offer", "title")
      .lean(),
  ]);

  const lessonMap = new Map(lessonRows.map((row) => [String(row._id), row]));
  const pendingMap = new Map(pendingRows.map((row) => [String(row._id), row.count]));
  const bookingMap = new Map();
  latestBookings.forEach((booking) => {
    const key = String(booking.student);
    if (!bookingMap.has(key)) bookingMap.set(key, booking);
  });

  const students = users.map((user) => {
    const key = String(user._id);
    const row = lessonMap.get(key) || {};
    const totalLessons = Number(row.totalLessons || 0);
    const completedLessons = Number(row.completedLessons || 0);
    const activeLessons = Number(row.activeLessons || 0);
    const pendingBookings = Number(pendingMap.get(key) || 0);
    const latestBooking = bookingMap.get(key);
    const status =
      activeLessons > 0
        ? "active"
        : pendingBookings > 0
          ? "pending"
          : totalLessons > 0 && completedLessons === totalLessons
            ? "completed"
            : "inactive";

    return {
      ...user,
      totalLessons,
      completedLessons,
      activeLessons,
      pendingBookings,
      noShows: Number(row.noShows || 0),
      lastLessonAt: row.lastLessonAt || null,
      progress: totalLessons
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0,
      status,
      course:
        latestBooking?.offer?.title ||
        (latestBooking?.vehicleType
          ? `${latestBooking.vehicleType} driving`
          : "Driving lessons"),
    };
  });

  sendResponse(res, 200, "Teacher students fetched successfully.", students, {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
});

export const getMyStudentDetails = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!mongoose.isValidObjectId(studentId)) {
    throw new ApiError(400, "Invalid student ID.");
  }

  const accessFilter = { teacher: req.user._id, student: studentId };
  const [hasLesson, hasBooking] = await Promise.all([
    Lesson.exists(accessFilter),
    Booking.exists(accessFilter),
  ]);
  if (!hasLesson && !hasBooking) {
    throw new ApiError(403, "You do not have access to this student.");
  }

  const student = await User.findOne({ _id: studentId, role: "student" })
    .select("name email phone avatar status")
    .lean();
  if (!student) throw new ApiError(404, "Student not found.");

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const [statusRows, lessons, total] = await Promise.all([
    Lesson.aggregate([
      {
        $match: {
          teacher: req.user._id,
          student: new mongoose.Types.ObjectId(studentId),
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lesson.find(accessFilter)
      .sort({ lessonDate: -1, startTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("booking", "vehicleType location offer")
      .lean(),
    Lesson.countDocuments(accessFilter),
  ]);

  const counts = Object.fromEntries(
    statusRows.map((row) => [row._id, row.count]),
  );
  const completed = Number(counts.completed || 0);
  const assessableTotal = total - Number(counts.cancelled || 0) - Number(counts.no_show || 0);
  const latestReport = await Lesson.findOne({
    ...accessFilter,
    "lessonProgress.teacherSubmittedAt": { $exists: true },
  })
    .sort({ "lessonProgress.teacherSubmittedAt": -1 })
    .select("lessonProgress")
    .lean();

  sendResponse(
    res,
    200,
    "Teacher student details fetched successfully.",
    {
      student,
      stats: {
        totalLessons: total,
        completedLessons: completed,
        upcomingLessons: Number(counts.scheduled || 0),
        noShows: Number(counts.no_show || 0),
        progress: assessableTotal
          ? Math.round((completed / assessableTotal) * 100)
          : 0,
      },
      latestProgress: latestReport?.lessonProgress || null,
      lessons,
    },
    {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  );
});

// export const addVehicle = asyncHandler(async (req, res) => {
//   const vehicle = await TeacherVehicle.create({
//     ...req.body,
//     teacher: req.user._id,
//   });

//   await TeacherProfile.findOneAndUpdate(
//     {
//       user: req.user._id,
//     },
//     {
//       $addToSet: {
//         vehicles: vehicle._id,
//       },
//     },
//   );

//   sendResponse(res, 201, "Vehicle added successfully.", vehicle);
// });

// export const getVehicles = asyncHandler(async (req, res) => {
//   const vehicles = await TeacherVehicle.find({
//     teacher: req.user._id,
//   }).sort({
//     createdAt: -1,
//   });

//   sendResponse(res, 200, "Vehicles fetched successfully.", vehicles);
// });

//create  vehicle
// export const addVehicle = asyncHandler(async (req, res) => {
//   const vehicle = await TeacherVehicle.create({
//     ...req.body,
//     teacher: req.user._id,

//     vehicleImage: req.file ? req.file.path : undefined,
//   });

//   await TeacherProfile.findOneAndUpdate(
//     { user: req.user._id },
//     {
//       $addToSet: {
//         vehicles: vehicle._id,
//       },
//     }
//   );

//   sendResponse(res, 201, "Vehicle added successfully.", vehicle);
// });

export const addVehicle = asyncHandler(async (req, res) => {
  console.log("Body:", req.body);
  console.log("File:", req.file);

  const vehicle = await TeacherVehicle.create({
    ...req.body,
    teacher: req.user._id,
    vehicleImage: req.file ? req.file.path : undefined,
  });

  sendResponse(res, 201, "Vehicle added successfully.", vehicle);
});

// Get Logged-in Teacher Vehicles
export const getMyVehicles = asyncHandler(async (req, res) => {
  const vehicles = await TeacherVehicle.find({
    teacher: req.user._id,
  }).sort({ createdAt: -1 });

  sendResponse(res, 200, "Vehicles fetched successfully.", vehicles);
});

// Get All Vehicles (Admin)
export const getAllVehicles = asyncHandler(async (req, res) => {
  const vehicles = await TeacherVehicle.find()
    .populate("teacher", "name email phone")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "All vehicles fetched successfully.", vehicles);
});

// Get Vehicle By ID
export const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await TeacherVehicle.findById(req.params.id).populate(
    "teacher",
    "name email phone",
  );

  if (!vehicle) {
    return sendResponse(res, 404, "Vehicle not found.");
  }

  sendResponse(res, 200, "Vehicle fetched successfully.", vehicle);
});

// Update Vehicle
export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await TeacherVehicle.findOne({
    _id: req.params.id,
    teacher: req.user._id,
  });

  if (!vehicle) {
    return sendResponse(res, 404, "Vehicle not found.");
  }

  Object.assign(vehicle, req.body);

  await vehicle.save();

  sendResponse(res, 200, "Vehicle updated successfully.", vehicle);
});

// Delete Vehicle
export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await TeacherVehicle.findOne({
    _id: req.params.id,
    teacher: req.user._id,
  });

  if (!vehicle) {
    return sendResponse(res, 404, "Vehicle not found.");
  }

  await TeacherProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: {
        vehicles: vehicle._id,
      },
    },
  );

  await vehicle.deleteOne();

  sendResponse(res, 200, "Vehicle deleted successfully.");
});

// Get Vehicles By Teacher ID
export const getVehiclesByTeacher = asyncHandler(async (req, res) => {
  const vehicles = await TeacherVehicle.find({
    teacher: req.params.teacherId,
  }).sort({ createdAt: -1 });

  sendResponse(res, 200, "Teacher vehicles fetched successfully.", vehicles);
});

export const addLocation = asyncHandler(async (req, res) => {
  const location = await TeacherLocation.create({
    ...req.body,
    teacher: req.user._id,
  });

  await TeacherProfile.findOneAndUpdate(
    {
      user: req.user._id,
    },
    {
      $addToSet: {
        locations: location._id,
      },
    },
  );

  sendResponse(res, 201, "Location added successfully.", location);
});

export const getLocations = asyncHandler(async (req, res) => {
  const locations = await TeacherLocation.find({
    teacher: req.user._id,
  }).sort({
    createdAt: -1,
  });

  sendResponse(res, 200, "Locations fetched successfully.", locations);
});
