import mongoose from "mongoose";
import TeacherLocation from "../models/TeacherLocation.js";
import TeacherProfile from "../models/TeacherProfile.js";
import TeacherVehicle from "../models/TeacherVehicle.js";
import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Document from "../models/Document.js";
import TeacherAvailability from "../models/TeacherAvailability.js";
import User from "../models/User.js";
import StudentSkillAssessment from "../models/StudentSkillAssessment.js";
import Setting from "../models/Setting.js";

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

export const getBookedTeacherProfile = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.teacherId)) throw new ApiError(400, "Invalid teacher id.");
  const teacherId = req.params.teacherId;
  if (req.user.role === "student") {
    const hasBooking = await Booking.exists({ student: req.user._id, teacher: teacherId });
    if (!hasBooking) throw new ApiError(403, "You can only view an instructor you have booked.");
  }

  const [profile, vehicles, locations, availability, lessons, documents] = await Promise.all([
    TeacherProfile.findOne({ user: teacherId }).populate("user", "name fullName email phone avatar city address dateOfBirth").lean(),
    TeacherVehicle.find({ teacher: teacherId, status: "active" }).lean(),
    TeacherLocation.find({ teacher: teacherId, status: "active" }).lean(),
    TeacherAvailability.findOne({ teacher: teacherId }).lean(),
    Lesson.find({ teacher: teacherId }).select("student status duration").lean(),
    Document.find({ user: teacherId }).select("requirementKey title type status").lean(),
  ]);
  if (!profile?.user) throw new ApiError(404, "Instructor profile not found.");

  const completed = lessons.filter((lesson) => lesson.status === "completed");
  const decided = lessons.filter((lesson) => ["completed", "cancelled", "no_show"].includes(lesson.status));
  sendResponse(res, 200, "Booked instructor profile fetched.", {
    ...profile,
    vehicles,
    locations,
    availability,
    documents,
    stats: {
      studentsTrained: new Set(completed.map((lesson) => String(lesson.student))).size,
      completionRate: decided.length ? Math.round((completed.length / decided.length) * 100) : 0,
      lessonsCompleted: completed.length,
      hoursWorked: Math.round((completed.reduce((sum, lesson) => sum + Number(lesson.duration || 0), 0) / 60) * 10) / 10,
      reviews: Number(profile.rating?.totalReviews || 0),
    },
  });
});

export const getStudentBookletSkills = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.studentId)) throw new ApiError(400, "Invalid student id.");
  const hasBooking = await Booking.exists({ teacher: req.user._id, student: req.params.studentId });
  if (!hasBooking) throw new ApiError(403, "This student has not booked a lesson with you.");
  const [student, assessments, completedLessons] = await Promise.all([
    User.findById(req.params.studentId).select("name fullName email avatar").lean(),
    StudentSkillAssessment.find({ student: req.params.studentId }).sort({ skill: 1 }).lean(),
    Lesson.find({
      teacher: req.user._id,
      student: req.params.studentId,
      status: "completed",
    })
      .select("title lessonDate startTime endTime duration lessonProgress.teacherNotes lessonProgress.teacherSubmittedAt")
      .sort({ lessonDate: -1, startTime: -1 })
      .limit(50)
      .lean(),
  ]);
  if (!student) throw new ApiError(404, "Student not found.");
  sendResponse(res, 200, "Student booklet skills fetched.", {
    student,
    assessments,
    completedLessons,
  });
});

export const updateStudentLessonNote = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const lessonId = String(req.body.lessonId || "").trim();
  const teacherNotes = String(req.body.teacherNotes || "").trim();

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid student id.");
  }
  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new ApiError(400, "Select a valid completed lesson.");
  }
  if (!teacherNotes) {
    throw new ApiError(400, "Instructor note is required.");
  }
  if (teacherNotes.length > 2000) {
    throw new ApiError(400, "Instructor note cannot exceed 2000 characters.");
  }

  const lesson = await Lesson.findOne({
    _id: lessonId,
    teacher: req.user._id,
    student: studentId,
    status: "completed",
  });

  if (!lesson) {
    throw new ApiError(
      404,
      "Completed lesson not found or it does not belong to this student.",
    );
  }

  lesson.lessonProgress.teacherNotes = teacherNotes;
  lesson.lessonProgress.teacherSubmittedAt = new Date();
  await lesson.save();

  sendResponse(res, 200, "Instructor note saved successfully.", lesson);
});

export const getMyExamStudents = asyncHandler(async (req, res) => {
  const lessons = await Lesson.find({
    teacher: req.user._id,
    status: { $nin: ["cancelled", "no_show"] },
  })
    .select("student booking lessonDate startTime endTime status")
    .populate("student", "name fullName avatar")
    .populate("booking", "location")
    .sort({ lessonDate: -1, startTime: -1 })
    .lean();

  const studentIds = [...new Set(lessons.filter((item) => item.student).map((item) => String(item.student._id)))];
  const [assessments, targetSetting] = await Promise.all([
    StudentSkillAssessment.find({ student: { $in: studentIds } }).select("student status").lean(),
    Setting.findOne({ key: "requiredSkillsPercentage" }).lean(),
  ]);
  const targetScore = Number(targetSetting?.value || 60);
  const scoreMap = new Map();
  assessments.forEach((item) => {
    const key = String(item.student);
    const current = scoreMap.get(key) || { points: 0, count: 0 };
    current.points += item.status === "acquired" ? 100 : item.status === "to_work" ? 50 : 0;
    current.count += 1;
    scoreMap.set(key, current);
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = lessons.filter((lesson) => lesson.student).map((lesson) => {
    const score = scoreMap.get(String(lesson.student._id)) || { points: 0, count: 0 };
    const bookletAverage = score.count ? Math.round(score.points / Math.max(34, score.count)) : 0;
    const lessonDay = new Date(lesson.lessonDate);
    lessonDay.setHours(0, 0, 0, 0);
    const examStatus = lessonDay >= today ? "upcoming" : bookletAverage >= targetScore ? "passed" : "failed";
    const location = lesson.booking?.location || {};
    return {
      _id: lesson._id,
      student: lesson.student,
      examCenter: [location.address, location.city].filter(Boolean).join(", ") || "Location not available",
      date: lesson.lessonDate,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      status: examStatus,
      bookletAverage,
      targetScore,
    };
  });
  sendResponse(res, 200, "Teacher examination list fetched.", rows);
});

export const updateStudentBookletSkill = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.studentId)) throw new ApiError(400, "Invalid student id.");
  const skill = String(req.body.skill || "").trim();
  const status = String(req.body.status || "");
  const category = ["C1", "C2", "C3", "C4"].includes(req.body.category) ? req.body.category : "C1";
  if (!skill || !["not_acquired", "to_work", "acquired"].includes(status)) throw new ApiError(400, "A valid skill and status are required.");
  const hasBooking = await Booking.exists({ teacher: req.user._id, student: req.params.studentId });
  if (!hasBooking) throw new ApiError(403, "This student has not booked a lesson with you.");
  const assessment = await StudentSkillAssessment.findOneAndUpdate(
    { student: req.params.studentId, skill },
    { $set: { status, category, teacher: req.user._id } },
    { upsert: true, new: true, runValidators: true },
  );
  sendResponse(res, 200, "Booklet skill updated.", assessment);
});

export const updateStudentBookletSkills = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.studentId)) throw new ApiError(400, "Invalid student id.");
  const hasBooking = await Booking.exists({ teacher: req.user._id, student: req.params.studentId });
  if (!hasBooking) throw new ApiError(403, "This student has not booked a lesson with you.");
  const assessments = Array.isArray(req.body.assessments) ? req.body.assessments : [];
  if (!assessments.length || assessments.length > 50) throw new ApiError(400, "Provide between 1 and 50 skill assessments.");
  const cleaned = assessments.map((item) => {
    const skill = String(item.skill || "").trim();
    const status = String(item.status || "");
    const category = ["C1", "C2", "C3", "C4"].includes(item.category) ? item.category : "C1";
    if (!skill || !["not_acquired", "to_work", "acquired"].includes(status)) throw new ApiError(400, "Every assessment requires a valid skill and status.");
    return { skill, status, category };
  });
  await StudentSkillAssessment.bulkWrite(cleaned.map((item) => ({ updateOne: { filter: { student: req.params.studentId, skill: item.skill }, update: { $set: { ...item, teacher: req.user._id } }, upsert: true } })));
  const saved = await StudentSkillAssessment.find({ student: req.params.studentId, skill: { $in: cleaned.map((item) => item.skill) } }).lean();
  sendResponse(res, 200, "Booklet skills updated.", saved);
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
      .populate({ path: "booking", populate: { path: "offer", select: "title" } }),
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
  const recentBookingRows = await Booking.find({
    teacher: req.user._id,
    status: { $in: ["pending", "confirmed", "completed"] },
  })
    .sort({ bookingDate: -1, createdAt: -1 })
    .limit(50)
    .populate("student", "name email phone avatar")
    .populate("offer", "title")
    .lean();
  const recentStudents = [];
  const seenStudentIds = new Set();
  recentBookingRows.forEach((booking) => {
    const studentId = String(booking.student?._id || "");
    if (!studentId || seenStudentIds.has(studentId) || recentStudents.length >= 2) return;
    seenStudentIds.add(studentId);
    recentStudents.push(booking);
  });
  const progressStudentIds = recentStudents.map(
    (booking) => booking.student._id,
  );
  const progressAssessments = await StudentSkillAssessment.find({
    student: { $in: progressStudentIds },
  })
    .select("student status")
    .lean();
  const bookletScores = new Map();
  progressAssessments.forEach((assessment) => {
    const key = String(assessment.student);
    const current = bookletScores.get(key) || { points: 0, count: 0 };
    current.points +=
      assessment.status === "acquired"
        ? 100
        : assessment.status === "to_work"
          ? 50
          : 0;
    current.count += 1;
    bookletScores.set(key, current);
  });
  const lessonsInProgress = recentStudents.map((booking) => {
    const score = bookletScores.get(String(booking.student?._id)) || {
      points: 0,
      count: 0,
    };
    return {
      _id: booking._id,
      student: booking.student,
      startTime: booking.startTime,
      endTime: booking.endTime,
      title:
        booking.offer?.title ||
        `${booking.student?.name || "Student"} driving lesson`,
      bookletProgress: score.count
        ? Math.round(score.points / Math.max(34, score.count))
        : 0,
    };
  });
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
    lessonsInProgress,
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
      bookingDate: latestBooking?.bookingDate || null,
      duration: Number(latestBooking?.duration || 0),
      startTime: latestBooking?.startTime || "",
      endTime: latestBooking?.endTime || "",
      vehicleType:
        latestBooking?.vehicleType ||
        latestBooking?.vehicleSnapshot?.vehicleType ||
        "",
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
