// import StudentProfile from "../models/StudentProfile";
// import Booking from "../models/Booking";
// import Lesson from "../models/Lesson";
// import Payment from "../models/Payment";
// import Document from "../models/Document";
// import asyncHandler from "../utils/asyncHandler";
// import sendResponse from "../utils/ApiResponse";
// import ApiError from "../utils/ApiError";

// export const getDashboard = asyncHandler(async (req, res) => {
//   const [profile, bookings, lessons, payments, documents] = await Promise.all([
//     StudentProfile.findOne({ user: req.user._id }),
//     Booking.countDocuments({ student: req.user._id }),
//     Lesson.countDocuments({ student: req.user._id }),
//     Payment.countDocuments({ user: req.user._id }),
//     Document.countDocuments({ user: req.user._id }),
//   ]);

//   sendResponse(res, 200, "Student dashboard fetched.", {
//     profile,
//     stats: { bookings, lessons, payments, documents },
//   });
// });

// export const getProfile = asyncHandler(async (req, res) => {
//   const profile = await StudentProfile.findOne({ user: req.user._id }).populate(
//     "user",
//     "name email phone avatar",
//   );
//   if (!profile) throw new ApiError(404, "Student profile not found.");
//   sendResponse(res, 200, "Student profile fetched.", profile);
// });

// export const updateProfile = asyncHandler(async (req, res) => {
//   const profile = await StudentProfile.findOneAndUpdate(
//     { user: req.user._id },
//     req.body,
//     { new: true, runValidators: true },
//   );
//   if (!profile) throw new ApiError(404, "Student profile not found.");
//   sendResponse(res, 200, "Student profile updated.", profile);
// });

// export const addFavoriteTeacher = asyncHandler(async (req, res) => {
//   const { teacherId } = req.params;
//   const profile = await StudentProfile.findOneAndUpdate(
//     { user: req.user._id },
//     { $addToSet: { favoriteTeachers: teacherId } },
//     { new: true },
//   );
//   sendResponse(res, 200, "Teacher added to favorites.", profile);
// });

// export const removeFavoriteTeacher = asyncHandler(async (req, res) => {
//   const { teacherId } = req.params;
//   const profile = await StudentProfile.findOneAndUpdate(
//     { user: req.user._id },
//     { $pull: { favoriteTeachers: teacherId } },
//     { new: true },
//   );
//   sendResponse(res, 200, "Teacher removed from favorites.", profile);
// });

import StudentProfile from "../models/StudentProfile.js";
import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Payment from "../models/Payment.js";
import Document from "../models/Document.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const ACTIVE_LESSON_STATUSES = [
  "scheduled",
  "in_progress",
  "awaiting_confirmation",
];

const getLessonProgressPercentage = (status) => {
  switch (status) {
    case "completed":
      return 100;
    case "awaiting_confirmation":
      return 85;
    case "in_progress":
      return 55;
    case "scheduled":
      return 20;
    default:
      return 0;
  }
};

const getLessonTitle = (lesson) => {
  const offer = lesson?.booking?.offer;

  return (
    offer?.title ||
    offer?.name ||
    offer?.offerName ||
    offer?.category ||
    "City Driving Practice"
  );
};

const mapLessonForDashboard = (lesson) => ({
  id: lesson._id,
  title: getLessonTitle(lesson),
  lessonDate: lesson.lessonDate,
  startTime: lesson.startTime,
  endTime: lesson.endTime,
  duration: lesson.duration,
  status: lesson.status,
  vehicleType:
    lesson?.booking?.vehicleType || lesson?.booking?.vehicle || "automatic",
  instructorName: lesson?.teacher?.name || "Michael Carter",
  progressPercent: getLessonProgressPercentage(lesson.status),
});

export const getDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const lessonPopulate = [
    {
      path: "teacher",
      select: "name avatar",
    },
    {
      path: "booking",
      select:
        "vehicleType offer location bookingDate startTime endTime duration",
      populate: {
        path: "offer",
      },
    },
  ];

  const [
    profile,
    bookings,
    payments,
    documents,
    lessonSummaryResult,
    skillsResult,
    lessonProgressRecords,
    upcomingLessonRecords,
  ] = await Promise.all([
    StudentProfile.findOne({ user: studentId })
      .populate("user", "name email phone avatar")
      .lean(),
    Booking.countDocuments({ student: studentId }),
    Payment.countDocuments({ user: studentId }),
    Document.countDocuments({ user: studentId }),
    Lesson.aggregate([
      {
        $match: {
          student: studentId,
        },
      },
      {
        $group: {
          _id: null,
          totalLessons: { $sum: 1 },
          completedLessons: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          inProgressLessons: {
            $sum: {
              $cond: [
                {
                  $in: ["$status", ["in_progress", "awaiting_confirmation"]],
                },
                1,
                0,
              ],
            },
          },
          notCompletedLessons: {
            $sum: {
              $cond: [
                {
                  $in: ["$status", ["scheduled", "cancelled", "no_show"]],
                },
                1,
                0,
              ],
            },
          },
          completedMinutes: {
            $sum: {
              $cond: [
                { $eq: ["$status", "completed"] },
                { $ifNull: ["$duration", 0] },
                0,
              ],
            },
          },
          upcomingMinutes: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$status", ACTIVE_LESSON_STATUSES] },
                    { $gte: ["$lessonDate", todayStart] },
                  ],
                },
                { $ifNull: ["$duration", 0] },
                0,
              ],
            },
          },
        },
      },
    ]),
    Lesson.aggregate([
      {
        $match: {
          student: studentId,
          "lessonProgress.skillsCovered.0": { $exists: true },
        },
      },
      { $unwind: "$lessonProgress.skillsCovered" },
      {
        $match: {
          "lessonProgress.skillsCovered": { $type: "string", $ne: "" },
        },
      },
      { $group: { _id: "$lessonProgress.skillsCovered" } },
      { $count: "count" },
    ]),
    Lesson.find({ student: studentId })
      .sort({ lessonDate: -1, startTime: -1 })
      .limit(3)
      .populate(lessonPopulate)
      .lean(),
    Lesson.find({
      student: studentId,
      status: { $in: ACTIVE_LESSON_STATUSES },
      lessonDate: { $gte: todayStart },
    })
      .sort({ lessonDate: 1, startTime: 1 })
      .limit(3)
      .populate(lessonPopulate)
      .lean(),
  ]);

  const lessonSummary = lessonSummaryResult[0] || {
    totalLessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    notCompletedLessons: 0,
    completedMinutes: 0,
    upcomingMinutes: 0,
  };

  const profileProgress = profile?.progress || {};
  const totalLessons = Math.max(
    Number(profileProgress.totalLessons || 0),
    Number(lessonSummary.totalLessons || 0),
  );
  const completedLessons = Math.max(
    Number(profileProgress.completedLessons || 0),
    Number(lessonSummary.completedLessons || 0),
  );
  const inProgressLessons = Number(lessonSummary.inProgressLessons || 0);
  const derivedNotCompleted = Math.max(
    totalLessons - completedLessons - inProgressLessons,
    0,
  );
  const notCompletedLessons = Math.max(
    Number(lessonSummary.notCompletedLessons || 0),
    Number(profileProgress.remainingLessons || 0),
    derivedNotCompleted,
  );

  const storedDrivingProgress = Number(profileProgress.drivingProgress || 0);
  const average =
    storedDrivingProgress > 0
      ? Math.min(Math.round(storedDrivingProgress), 100)
      : totalLessons > 0
        ? Math.min(Math.round((completedLessons / totalLessons) * 100), 100)
        : 0;

  const lessonProgress = lessonProgressRecords.map(mapLessonForDashboard);
  const upcomingSchedule = upcomingLessonRecords.map(mapLessonForDashboard);
  const nextDrivingLesson = upcomingSchedule[0] || null;

  sendResponse(res, 200, "Student dashboard fetched.", {
    profile,
    stats: {
      timeTakenHours: Number(
        (Number(lessonSummary.completedMinutes || 0) / 60).toFixed(1),
      ),
      timeToComeMinutes: Number(lessonSummary.upcomingMinutes || 0),
      skillsAcquired: Number(skillsResult[0]?.count || 0),
      hoursLeft: Math.ceil(Number(lessonSummary.upcomingMinutes || 0) / 60),
      bookings,
      lessons: Number(lessonSummary.totalLessons || 0),
      payments,
      documents,
    },
    lessonProgress,
    upcomingSchedule,
    progressStatistics: {
      completed: completedLessons,
      inProgress: inProgressLessons,
      notCompleted: notCompletedLessons,
      average,
    },
    practiceDriving: {
      scheduled: Boolean(nextDrivingLesson),
      lesson: nextDrivingLesson,
    },
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

  if (!profile) throw new ApiError(404, "Student profile not found.");

  sendResponse(res, 200, "Teacher added to favorites.", profile);
});

export const removeFavoriteTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { favoriteTeachers: teacherId } },
    { new: true },
  );

  if (!profile) throw new ApiError(404, "Student profile not found.");

  sendResponse(res, 200, "Teacher removed from favorites.", profile);
});
