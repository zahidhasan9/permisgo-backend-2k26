// import StudentProfile from "../models/StudentProfile.js";
// import Booking from "../models/Booking.js";
// import Lesson from "../models/Lesson.js";
// import Payment from "../models/Payment.js";
// import Document from "../models/Document.js";
// import asyncHandler from "../utils/asyncHandler.js";
// import sendResponse from "../utils/ApiResponse.js";
// import ApiError from "../utils/ApiError.js";

// const ACTIVE_LESSON_STATUSES = [
//   "scheduled",
//   "in_progress",
//   "awaiting_confirmation",
// ];

// const getLessonProgressPercentage = (status) => {
//   switch (status) {
//     case "completed":
//       return 100;
//     case "awaiting_confirmation":
//       return 85;
//     case "in_progress":
//       return 55;
//     case "scheduled":
//       return 20;
//     default:
//       return 0;
//   }
// };

// const getLessonTitle = (lesson) => {
//   const offer = lesson?.booking?.offer;

//   return (
//     offer?.title ||
//     offer?.name ||
//     offer?.offerName ||
//     offer?.category ||
//     "City Driving Practice"
//   );
// };

// const mapLessonForDashboard = (lesson) => ({
//   id: lesson._id,
//   title: getLessonTitle(lesson),
//   lessonDate: lesson.lessonDate,
//   startTime: lesson.startTime,
//   endTime: lesson.endTime,
//   duration: lesson.duration,
//   status: lesson.status,
//   vehicleType:
//     lesson?.booking?.vehicleType || lesson?.booking?.vehicle || "automatic",
//   instructorName: lesson?.teacher?.name || "Michael Carter",
//   progressPercent: getLessonProgressPercentage(lesson.status),
// });

// export const getDashboard = asyncHandler(async (req, res) => {
//   const studentId = req.user._id;
//   const todayStart = new Date();
//   todayStart.setHours(0, 0, 0, 0);

//   const lessonPopulate = [
//     {
//       path: "teacher",
//       select: "name avatar",
//     },
//     {
//       path: "booking",
//       select:
//         "vehicleType offer location bookingDate startTime endTime duration",
//       populate: {
//         path: "offer",
//       },
//     },
//   ];

//   const [
//     profile,
//     bookings,
//     payments,
//     documents,
//     lessonSummaryResult,
//     skillsResult,
//     lessonProgressRecords,
//     upcomingLessonRecords,
//   ] = await Promise.all([
//     StudentProfile.findOne({ user: studentId })
//       .populate("user", "name email phone avatar")
//       .lean(),
//     Booking.countDocuments({ student: studentId }),
//     Payment.countDocuments({ user: studentId }),
//     Document.countDocuments({ user: studentId }),
//     Lesson.aggregate([
//       {
//         $match: {
//           student: studentId,
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           totalLessons: { $sum: 1 },
//           completedLessons: {
//             $sum: {
//               $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
//             },
//           },
//           inProgressLessons: {
//             $sum: {
//               $cond: [
//                 {
//                   $in: ["$status", ["in_progress", "awaiting_confirmation"]],
//                 },
//                 1,
//                 0,
//               ],
//             },
//           },
//           notCompletedLessons: {
//             $sum: {
//               $cond: [
//                 {
//                   $in: ["$status", ["scheduled", "cancelled", "no_show"]],
//                 },
//                 1,
//                 0,
//               ],
//             },
//           },
//           completedMinutes: {
//             $sum: {
//               $cond: [
//                 { $eq: ["$status", "completed"] },
//                 { $ifNull: ["$duration", 0] },
//                 0,
//               ],
//             },
//           },
//           upcomingMinutes: {
//             $sum: {
//               $cond: [
//                 {
//                   $and: [
//                     { $in: ["$status", ACTIVE_LESSON_STATUSES] },
//                     { $gte: ["$lessonDate", todayStart] },
//                   ],
//                 },
//                 { $ifNull: ["$duration", 0] },
//                 0,
//               ],
//             },
//           },
//         },
//       },
//     ]),
//     Lesson.aggregate([
//       {
//         $match: {
//           student: studentId,
//           "lessonProgress.skillsCovered.0": { $exists: true },
//         },
//       },
//       { $unwind: "$lessonProgress.skillsCovered" },
//       {
//         $match: {
//           "lessonProgress.skillsCovered": { $type: "string", $ne: "" },
//         },
//       },
//       { $group: { _id: "$lessonProgress.skillsCovered" } },
//       { $count: "count" },
//     ]),
//     Lesson.find({ student: studentId })
//       .sort({ lessonDate: -1, startTime: -1 })
//       .limit(3)
//       .populate(lessonPopulate)
//       .lean(),
//     Lesson.find({
//       student: studentId,
//       status: { $in: ACTIVE_LESSON_STATUSES },
//       lessonDate: { $gte: todayStart },
//     })
//       .sort({ lessonDate: 1, startTime: 1 })
//       .limit(3)
//       .populate(lessonPopulate)
//       .lean(),
//   ]);

//   const lessonSummary = lessonSummaryResult[0] || {
//     totalLessons: 0,
//     completedLessons: 0,
//     inProgressLessons: 0,
//     notCompletedLessons: 0,
//     completedMinutes: 0,
//     upcomingMinutes: 0,
//   };

//   const profileProgress = profile?.progress || {};
//   const totalLessons = Math.max(
//     Number(profileProgress.totalLessons || 0),
//     Number(lessonSummary.totalLessons || 0),
//   );
//   const completedLessons = Math.max(
//     Number(profileProgress.completedLessons || 0),
//     Number(lessonSummary.completedLessons || 0),
//   );
//   const inProgressLessons = Number(lessonSummary.inProgressLessons || 0);
//   const derivedNotCompleted = Math.max(
//     totalLessons - completedLessons - inProgressLessons,
//     0,
//   );
//   const notCompletedLessons = Math.max(
//     Number(lessonSummary.notCompletedLessons || 0),
//     Number(profileProgress.remainingLessons || 0),
//     derivedNotCompleted,
//   );

//   const storedDrivingProgress = Number(profileProgress.drivingProgress || 0);
//   const average =
//     storedDrivingProgress > 0
//       ? Math.min(Math.round(storedDrivingProgress), 100)
//       : totalLessons > 0
//         ? Math.min(Math.round((completedLessons / totalLessons) * 100), 100)
//         : 0;

//   const lessonProgress = lessonProgressRecords.map(mapLessonForDashboard);
//   const upcomingSchedule = upcomingLessonRecords.map(mapLessonForDashboard);
//   const nextDrivingLesson = upcomingSchedule[0] || null;

//   sendResponse(res, 200, "Student dashboard fetched.", {
//     profile,
//     stats: {
//       timeTakenHours: Number(
//         (Number(lessonSummary.completedMinutes || 0) / 60).toFixed(1),
//       ),
//       timeToComeMinutes: Number(lessonSummary.upcomingMinutes || 0),
//       skillsAcquired: Number(skillsResult[0]?.count || 0),
//       hoursLeft: Math.ceil(Number(lessonSummary.upcomingMinutes || 0) / 60),
//       bookings,
//       lessons: Number(lessonSummary.totalLessons || 0),
//       payments,
//       documents,
//     },
//     lessonProgress,
//     upcomingSchedule,
//     progressStatistics: {
//       completed: completedLessons,
//       inProgress: inProgressLessons,
//       notCompleted: notCompletedLessons,
//       average,
//     },
//     practiceDriving: {
//       scheduled: Boolean(nextDrivingLesson),
//       lesson: nextDrivingLesson,
//     },
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

//   if (!profile) throw new ApiError(404, "Student profile not found.");

//   sendResponse(res, 200, "Teacher added to favorites.", profile);
// });

// export const removeFavoriteTeacher = asyncHandler(async (req, res) => {
//   const { teacherId } = req.params;

//   const profile = await StudentProfile.findOneAndUpdate(
//     { user: req.user._id },
//     { $pull: { favoriteTeachers: teacherId } },
//     { new: true },
//   );

//   if (!profile) throw new ApiError(404, "Student profile not found.");

//   sendResponse(res, 200, "Teacher removed from favorites.", profile);
// });

import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Payment from "../models/Payment.js";
import Document from "../models/Document.js";
import StudentSkillAssessment from "../models/StudentSkillAssessment.js";
import QuizAttempt from "../models/QuizAttempt.js";
import TeacherProfile from "../models/TeacherProfile.js";
import Exam from "../models/Exam.js";
import Setting from "../models/Setting.js";

import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

export const getMyBookletSkills = asyncHandler(async (req, res) => {
  const assessments = await StudentSkillAssessment.find({ student: req.user._id }).sort({ skill: 1 }).lean();
  sendResponse(res, 200, "Booklet skills fetched.", assessments);
});

export const getMyFavoriteTeachers = asyncHandler(async (req, res) => {
  const studentProfile = await StudentProfile.findOne({ user: req.user._id })
    .select("favoriteTeachers")
    .lean();
  const favoriteIds = studentProfile?.favoriteTeachers || [];
  if (!favoriteIds.length) {
    return sendResponse(res, 200, "Favorite teachers fetched.", []);
  }

  const profiles = await TeacherProfile.find({ user: { $in: favoriteIds } })
    .populate("user", "name fullName email phone avatar status")
    .populate("vehicles", "vehicleName vehicleType brand model status approvalStatus")
    .populate("locations", "title address city status")
    .lean();
  const profileByUser = new Map(
    profiles.filter((profile) => profile.user).map((profile) => [String(profile.user._id), profile]),
  );
  const ordered = favoriteIds.map((id) => profileByUser.get(String(id))).filter(Boolean);
  return sendResponse(res, 200, "Favorite teachers fetched.", ordered);
});

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /**
   * Profile না থাকলে create হবে।
   * আগে এখানে new: true থাকার কারণে warning আসছিল।
   */
  const profile = await ensureStudentProfile(userId);
  const [registrationUser, registrationDocuments] = await Promise.all([
    User.findById(userId)
      .select("name email phone avatar gender dateOfBirth address city")
      .lean(),
    Document.find({ user: userId })
      .select("requirementKey status createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const [bookings, lessons, payments, documents, upcomingLessons, completedLessons, bookedInstructorRecords, completedLessonSummary, quizAttemptSummary, drivingExam] = await Promise.all([
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
    Lesson.find({
      student: userId,
      lessonDate: { $gte: today },
      status: { $in: ["scheduled", "in_progress", "awaiting_confirmation"] },
    })
      .sort({ lessonDate: 1, startTime: 1 })
      .limit(10)
      .populate("teacher", "name fullName email phone avatar")
      .populate({ path: "booking", populate: { path: "offer", select: "title category" } })
      .lean(),
    Lesson.find({ student: userId, status: "completed" })
      .sort({ lessonDate: -1, startTime: -1 })
      .limit(3)
      .populate("teacher", "name fullName email phone avatar")
      .populate({ path: "booking", populate: { path: "offer", select: "title category" } })
      .lean(),
    Booking.find({
      student: userId,
      status: { $in: ["pending", "confirmed", "completed"] },
    })
      .sort({ bookingDate: -1, createdAt: -1 })
      .populate("teacher", "name fullName email phone avatar")
      .select("teacher bookingDate status")
      .lean(),
    Lesson.aggregate([
      { $match: { student: userId, status: "completed" } },
      { $group: { _id: null, minutes: { $sum: { $ifNull: ["$duration", 0] } }, count: { $sum: 1 } } },
    ]),
    QuizAttempt.aggregate([
      { $match: { student: userId } },
      {
        $group: {
          _id: null,
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          notCompleted: { $sum: { $cond: [{ $eq: ["$status", "abandoned"] }, 1, 0] } },
          average: {
            $avg: { $cond: [{ $eq: ["$status", "completed"] }, "$percentage", null] },
          },
          totalAttempts: { $sum: 1 },
        },
      },
    ]),
    Exam.findOne({ student: userId, examType: "driving" }).sort({ createdAt: -1 }).lean(),
  ]);

  const mapLesson = (lesson) => ({
    _id: lesson._id,
    id: lesson._id,
    title: lesson.booking?.offer?.title || "Driving Lesson",
    lessonDate: lesson.lessonDate,
    startTime: lesson.startTime,
    endTime: lesson.endTime,
    duration: lesson.duration,
    status: lesson.status,
    instructorName: lesson.teacher?.name || lesson.teacher?.fullName || "Instructor",
    teacher: lesson.teacher,
    vehicleType: lesson.booking?.vehicleType || lesson.booking?.vehicle?.vehicleType || "automatic",
    vehicle: lesson.booking?.vehicle || null,
    location: lesson.booking?.location || null,
    progressPercent: lesson.status === "completed" ? 100 : lesson.status === "in_progress" ? 55 : 20,
  });

  const completedMinutes = Number(completedLessonSummary[0]?.minutes || 0);
  const upcomingMinutes = upcomingLessons.reduce(
    (total, lesson) => total + Number(lesson.duration || 0),
    0,
  );
  const completedHours = Number((completedMinutes / 60).toFixed(1));
  const quizAverage = Math.round(Number(quizAttemptSummary[0]?.average || 0));
  const completedQuizzes = Number(quizAttemptSummary[0]?.completed || 0);
  const codeProgress = completedQuizzes ? Math.min(quizAverage, 100) : 0;
  const [journeySettings, bookletAssessments] = await Promise.all([
    Setting.find({ key: { $in: ["requiredDrivingHours", "requiredSkillsPercentage"] } }).lean(),
    StudentSkillAssessment.find({ student: userId }).select("status").lean(),
  ]);
  const settingValues = new Map(journeySettings.map((item) => [item.key, item.value]));
  const drivingTargetHours = Number(settingValues.get("requiredDrivingHours") || 20);
  const targetSkillsPercentage = Number(settingValues.get("requiredSkillsPercentage") || 60);
  const skillScore = bookletAssessments.reduce((total, item) => {
    if (item.status === "acquired") return total + 100;
    if (item.status === "to_work") return total + 50;
    return total;
  }, 0);
  const totalBookletSkills = Math.max(34, bookletAssessments.length);
  const bookletAverage = bookletAssessments.length
    ? Math.round(skillScore / totalBookletSkills)
    : 0;
  const drivingProgress = Math.min(Math.round((completedHours / drivingTargetHours) * 100), 100);
  const examProgress = drivingExam?.status === "passed" ? 100 : drivingExam?.status === "scheduled" ? 50 : 0;
  const requiredRegistrationFields = [
    registrationUser?.name,
    registrationUser?.email,
    registrationUser?.phone,
    registrationUser?.gender,
    registrationUser?.dateOfBirth,
    registrationUser?.address,
    registrationUser?.city,
    profile?.postalCode,
    profile?.nephNumber,
    profile?.drivingInfo?.licenseType,
    profile?.drivingInfo?.currentLevel,
    profile?.drivingInfo?.preferredVehicleType,
    profile?.drivingInfo?.previousExperience,
  ];
  const profileComplete = requiredRegistrationFields.every((value) =>
    String(value || "").trim(),
  );
  const requiredDocumentKeys = [
    "identity_front",
    "identity_back",
    "license_front",
    "license_back",
    "proof_address",
  ];
  const latestDocumentByKey = new Map();
  registrationDocuments.forEach((document) => {
    if (!latestDocumentByKey.has(document.requirementKey)) {
      latestDocumentByKey.set(document.requirementKey, document);
    }
  });
  const approvedDocumentKeys = new Set(
    [...latestDocumentByKey.values()]
      .filter((document) => document.status === "approved")
      .map((document) => document.requirementKey),
  );
  const approvedRequiredDocuments = requiredDocumentKeys.filter((key) =>
    approvedDocumentKeys.has(key),
  ).length;
  const documentsApproved = approvedRequiredDocuments === requiredDocumentKeys.length;
  const hasValue = (value) => String(value || "").trim().length > 0;
  const profileCompletionItems = [
    {
      code: "account_setup",
      label: "Account Setup",
      weight: 10,
      completed: [registrationUser?.name, registrationUser?.email].every(hasValue),
    },
    {
      code: "profile_photo",
      label: "Profile Photo",
      weight: 10,
      completed: hasValue(registrationUser?.avatar),
    },
    {
      code: "personal_info",
      label: "Personal Info",
      weight: 20,
      completed: [
        registrationUser?.dateOfBirth || profile?.dateOfBirth,
        registrationUser?.gender || profile?.gender,
      ].every(hasValue),
    },
    {
      code: "driving_info",
      label: "Driving Info (+20%)",
      weight: 20,
      completed: [
        profile?.drivingInfo?.licenseType,
        profile?.drivingInfo?.currentLevel,
        profile?.drivingInfo?.preferredVehicleType,
        profile?.drivingInfo?.previousExperience,
      ].every(hasValue),
    },
    {
      code: "contact",
      label: "Contact",
      weight: 20,
      completed: [
        registrationUser?.phone,
        registrationUser?.address || profile?.address,
        registrationUser?.city || profile?.city,
      ].every(hasValue),
    },
    {
      code: "documents",
      label: "Documents (+20%)",
      weight: 20,
      completed: documentsApproved,
    },
  ];
  const profileCompletionPercentage = profileCompletionItems.reduce(
    (total, item) => total + (item.completed ? item.weight : 0),
    0,
  );
  const registrationComplete = profileComplete && documentsApproved;
  const firstLessonComplete = Number(completedLessonSummary[0]?.count || 0) > 0;
  const journeySteps = [
    { code: "registration", label: "Driving registration", progress: registrationComplete ? 100 : 0, completed: registrationComplete },
    { code: "first_lesson", label: "First lesson", progress: firstLessonComplete ? 100 : 0, completed: firstLessonComplete },
    { code: "driving_training", label: "Driving training", progress: 0, completed: false },
    { code: "exam_preparation", label: "Exam preparation", progress: 0, completed: false },
    { code: "practical_exam", label: "Practical exam", progress: 0, completed: false },
  ];
  const firstIncompleteStep = journeySteps.findIndex((step) => !step.completed);
  const currentStepIndex = firstIncompleteStep === -1 ? journeySteps.length - 1 : firstIncompleteStep;
  const seenInstructorIds = new Set();
  const bookedInstructors = bookedInstructorRecords.reduce((items, booking) => {
    const teacher = booking.teacher;
    const teacherId = teacher?._id?.toString();
    if (!teacherId || seenInstructorIds.has(teacherId)) return items;

    seenInstructorIds.add(teacherId);
    items.push({
      _id: teacher._id,
      name: teacher.name || teacher.fullName || "Instructor",
      avatar: teacher.avatar || "",
      phone: teacher.phone || "",
      email: teacher.email || "",
      lastBookedAt: booking.bookingDate,
    });
    return items;
  }, []);

  return sendResponse(res, 200, "Student dashboard fetched.", {
    profile,

    stats: {
      bookings,
      lessons,
      payments,
      documents,
      timeTakenHours: completedHours,
      timeToComeMinutes: upcomingMinutes,
    },
    lessonProgress: completedLessons.map(mapLesson),
    upcomingSchedule: upcomingLessons.map(mapLesson),
    bookedInstructors,
    profileCompletion: {
      percentage: profileCompletionPercentage,
      items: profileCompletionItems,
    },
    practiceDriving: {
      scheduled: upcomingLessons.length > 0,
      lesson: upcomingLessons.length ? mapLesson(upcomingLessons[0]) : null,
    },
    progressStatistics: {
      completed: Number(quizAttemptSummary[0]?.completed || 0),
      inProgress: Number(quizAttemptSummary[0]?.inProgress || 0),
      notCompleted: Number(quizAttemptSummary[0]?.notCompleted || 0),
      average: quizAverage,
      totalAttempts: Number(quizAttemptSummary[0]?.totalAttempts || 0),
    },
    licenseJourney: {
      steps: journeySteps,
      currentStep: currentStepIndex + 1,
      currentStepLabel: journeySteps[currentStepIndex]?.label || "License Completed",
      completedHours,
      targetHours: drivingTargetHours,
      skillsPercentage: bookletAverage,
      targetSkillsPercentage,
      overallProgress: Math.round(journeySteps.reduce((sum, step) => sum + step.progress, 0) / journeySteps.length),
      documentsUploaded: documents,
      registration: {
        profileComplete,
        documentsApproved,
        approvedDocuments: approvedRequiredDocuments,
        requiredDocuments: requiredDocumentKeys.length,
        completed: registrationComplete,
      },
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
