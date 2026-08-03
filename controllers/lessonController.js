// import Booking from "../models/Booking.js";
// import Lesson from "../models/Lesson.js";
// import Notification from "../models/Notification.js";
// import User from "../models/User.js";
// import ApiError from "../utils/ApiError.js";
// import sendResponse from "../utils/ApiResponse.js";
// import asyncHandler from "../utils/asyncHandler.js";

// const LESSON_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"];

// const ACTIVE_LESSON_STATUSES = ["scheduled", "in_progress"];

// const VEHICLE_TYPES = ["manual", "automatic"];

// const getId = (value) => {
//   return String(value?._id || value || "");
// };

// const getDayRange = (value) => {
//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     throw new ApiError(400, "Invalid lesson date.");
//   }

//   const start = new Date(date);
//   start.setHours(0, 0, 0, 0);

//   const end = new Date(date);
//   end.setHours(23, 59, 59, 999);

//   return {
//     date,
//     start,
//     end,
//   };
// };

// const timeToMinutes = (value) => {
//   const match = String(value || "").match(/^(\d{2}):(\d{2})$/);

//   if (!match) {
//     throw new ApiError(400, "Time must use HH:mm format.");
//   }

//   const hours = Number(match[1]);
//   const minutes = Number(match[2]);

//   if (hours > 23 || minutes > 59) {
//     throw new ApiError(400, "Invalid time value.");
//   }

//   return hours * 60 + minutes;
// };

// const calculateDuration = (startTime, endTime) => {
//   const start = timeToMinutes(startTime);

//   const end = timeToMinutes(endTime);

//   if (end <= start) {
//     throw new ApiError(400, "End time must be after start time.");
//   }

//   return end - start;
// };

// const populateLesson = (query) => {
//   return query
//     .populate("student", "name email phone avatar status")
//     .populate("teacher", "name email phone avatar status")
//     .populate({
//       path: "booking",
//       populate: {
//         path: "offer",
//         select: "title salePrice category",
//       },
//     });
// };

// const canAccessLesson = (user, lesson) => {
//   if (user.role === "admin") {
//     return true;
//   }

//   if (user.role === "student") {
//     return getId(lesson.student) === getId(user);
//   }

//   if (user.role === "teacher") {
//     return getId(lesson.teacher) === getId(user);
//   }

//   return false;
// };

// const findActiveUser = async (userId, role, label) => {
//   const user = await User.findOne({
//     _id: userId,
//     role,
//     status: "active",
//   });

//   if (!user) {
//     throw new ApiError(400, `${label} is not available.`);
//   }

//   return user;
// };

// /**
//  * একই teacher অথবা student-এর একই সময়ে
//  * আরেকটি active lesson আছে কি না check করবে।
//  */
// const ensureNoScheduleConflict = async ({
//   student,
//   teacher,
//   lessonDate,
//   startTime,
//   endTime,
//   excludeLessonId = null,
// }) => {
//   const { start, end } = getDayRange(lessonDate);

//   const filter = {
//     status: {
//       $in: ACTIVE_LESSON_STATUSES,
//     },

//     lessonDate: {
//       $gte: start,
//       $lte: end,
//     },

//     /**
//      * Existing lesson:
//      * 09:00 - 10:00
//      *
//      * New lesson:
//      * 09:30 - 10:30
//      *
//      * এটি conflict হিসেবে ধরা হবে।
//      */
//     startTime: {
//       $lt: endTime,
//     },

//     endTime: {
//       $gt: startTime,
//     },

//     $or: [
//       {
//         student,
//       },
//       {
//         teacher,
//       },
//     ],
//   };

//   if (excludeLessonId) {
//     filter._id = {
//       $ne: excludeLessonId,
//     };
//   }

//   const conflict = await Lesson.findOne(filter).select(
//     "student teacher lessonDate startTime endTime",
//   );

//   if (!conflict) {
//     return;
//   }

//   if (getId(conflict.teacher) === getId(teacher)) {
//     throw new ApiError(
//       409,
//       "The selected teacher already has another lesson at this time.",
//     );
//   }

//   throw new ApiError(
//     409,
//     "The selected student already has another lesson at this time.",
//   );
// };

// /**
//  * Notification fail হলেও মূল lesson action fail করবে না।
//  */
// const createNotificationsSafely = async (notifications) => {
//   try {
//     await Notification.create(notifications);
//   } catch (error) {
//     console.error("Notification creation failed:", error.message);
//   }
// };

// /**
//  * Lesson update হলে linked booking-ও update করবে।
//  */
// const syncBookingFromLesson = async (lesson, extra = {}) => {
//   const bookingId = getId(lesson.booking);

//   if (!bookingId) {
//     return;
//   }

//   await Booking.findByIdAndUpdate(
//     bookingId,
//     {
//       teacher: lesson.teacher,
//       bookingDate: lesson.lessonDate,
//       startTime: lesson.startTime,
//       endTime: lesson.endTime,
//       duration: lesson.duration,
//       ...extra,
//     },
//     {
//       runValidators: true,
//     },
//   );
// };

// /**
//  * GET /api/lessons
//  *
//  * Admin: সব lesson
//  * Student: নিজের lesson
//  * Teacher: assigned lesson
//  */
// export const getLessons = asyncHandler(async (req, res) => {
//   const filter = {};

//   if (req.user.role === "student") {
//     filter.student = req.user._id;
//   }

//   if (req.user.role === "teacher") {
//     filter.teacher = req.user._id;
//   }

//   if (req.query.status && req.query.status !== "all") {
//     if (!LESSON_STATUSES.includes(req.query.status)) {
//       throw new ApiError(400, "Invalid lesson status filter.");
//     }

//     filter.status = req.query.status;
//   }

//   if (req.user.role === "admin" && req.query.student) {
//     filter.student = req.query.student;
//   }

//   if (req.user.role === "admin" && req.query.teacher) {
//     filter.teacher = req.query.teacher;
//   }

//   if (req.query.dateFrom || req.query.dateTo) {
//     filter.lessonDate = {};

//     if (req.query.dateFrom) {
//       filter.lessonDate.$gte = getDayRange(req.query.dateFrom).start;
//     }

//     if (req.query.dateTo) {
//       filter.lessonDate.$lte = getDayRange(req.query.dateTo).end;
//     }
//   }

//   const lessons = await populateLesson(
//     Lesson.find(filter).sort({
//       lessonDate: -1,
//       startTime: -1,
//     }),
//   );

//   return sendResponse(res, 200, "Lessons fetched successfully.", lessons);
// });

// /**
//  * GET /api/lessons/:id
//  */
// export const getLesson = asyncHandler(async (req, res) => {
//   const lesson = await populateLesson(Lesson.findById(req.params.id));

//   if (!lesson) {
//     throw new ApiError(404, "Lesson not found.");
//   }

//   if (!canAccessLesson(req.user, lesson)) {
//     throw new ApiError(403, "You are not allowed to access this lesson.");
//   }

//   return sendResponse(res, 200, "Lesson fetched successfully.", lesson);
// });

// /**
//  * POST /api/lessons
//  *
//  * শুধু admin lesson schedule করতে পারবে।
//  *
//  * Important:
//  * Admin lesson create করলে একই সঙ্গে
//  * একটি confirmed Booking তৈরি হবে।
//  */
// export const createLesson = asyncHandler(async (req, res) => {
//   const {
//     student,
//     teacher,
//     lessonDate,
//     startTime,
//     endTime,
//     vehicleType,
//     location = {},
//   } = req.body;

//   if (
//     !student ||
//     !teacher ||
//     !lessonDate ||
//     !startTime ||
//     !endTime ||
//     !vehicleType
//   ) {
//     throw new ApiError(
//       400,
//       "Student, teacher, date, start time, end time and vehicle type are required.",
//     );
//   }

//   if (!VEHICLE_TYPES.includes(vehicleType)) {
//     throw new ApiError(400, "Vehicle type must be manual or automatic.");
//   }

//   const [selectedStudent, selectedTeacher] = await Promise.all([
//     findActiveUser(student, "student", "Selected student"),

//     findActiveUser(teacher, "teacher", "Selected teacher"),
//   ]);

//   const { date } = getDayRange(lessonDate);

//   const duration = calculateDuration(startTime, endTime);

//   await ensureNoScheduleConflict({
//     student: selectedStudent._id,

//     teacher: selectedTeacher._id,

//     lessonDate: date,
//     startTime,
//     endTime,
//   });

//   const booking = await Booking.create({
//     student: selectedStudent._id,

//     teacher: selectedTeacher._id,

//     location: {
//       address: String(location?.address || "").trim(),

//       city: String(location?.city || "").trim(),
//     },

//     vehicleType,

//     bookingDate: date,

//     startTime,

//     endTime,

//     duration,

//     status: "confirmed",
//   });

//   let lesson;

//   try {
//     lesson = await Lesson.create({
//       booking: booking._id,

//       student: selectedStudent._id,

//       teacher: selectedTeacher._id,

//       lessonDate: date,

//       startTime,

//       endTime,

//       duration,

//       status: "scheduled",
//     });
//   } catch (error) {
//     /**
//      * Lesson create fail করলে
//      * orphan booking delete হবে।
//      */
//     await Booking.findByIdAndDelete(booking._id);

//     throw error;
//   }

//   await createNotificationsSafely([
//     {
//       user: selectedStudent._id,

//       title: "Lesson scheduled",

//       message: `Your lesson is scheduled for ${startTime}.`,

//       type: "lesson",

//       actionUrl: `/student/lessons/${lesson._id}`,
//     },

//     {
//       user: selectedTeacher._id,

//       title: "New lesson assigned",

//       message: `A lesson has been assigned for ${startTime}.`,

//       type: "lesson",

//       actionUrl: `/teacher/lessons/${lesson._id}`,
//     },
//   ]);

//   const createdLesson = await populateLesson(Lesson.findById(lesson._id));

//   return sendResponse(
//     res,
//     201,
//     "Lesson scheduled successfully.",
//     createdLesson,
//   );
// });

// /**
//  * PATCH /api/lessons/:id
//  *
//  * শুধু admin lesson schedule update করতে পারবে।
//  */
// export const updateLesson = asyncHandler(async (req, res) => {
//   const lesson = await Lesson.findById(req.params.id);

//   if (!lesson) {
//     throw new ApiError(404, "Lesson not found.");
//   }

//   if (["completed", "cancelled"].includes(lesson.status)) {
//     throw new ApiError(400, "Completed or cancelled lesson cannot be edited.");
//   }

//   const booking = await Booking.findById(lesson.booking);

//   const teacherId = req.body.teacher || lesson.teacher;

//   const lessonDate = req.body.lessonDate || lesson.lessonDate;

//   const startTime = req.body.startTime || lesson.startTime;

//   const endTime = req.body.endTime || lesson.endTime;

//   const vehicleType = req.body.vehicleType || booking?.vehicleType;

//   if (!VEHICLE_TYPES.includes(vehicleType)) {
//     throw new ApiError(400, "Vehicle type must be manual or automatic.");
//   }

//   const selectedTeacher = await findActiveUser(
//     teacherId,
//     "teacher",
//     "Selected teacher",
//   );

//   const { date } = getDayRange(lessonDate);

//   const duration = calculateDuration(startTime, endTime);

//   await ensureNoScheduleConflict({
//     student: lesson.student,

//     teacher: selectedTeacher._id,

//     lessonDate: date,

//     startTime,

//     endTime,

//     excludeLessonId: lesson._id,
//   });

//   lesson.teacher = selectedTeacher._id;

//   lesson.lessonDate = date;

//   lesson.startTime = startTime;

//   lesson.endTime = endTime;

//   lesson.duration = duration;

//   await lesson.save();

//   const bookingUpdate = {
//     vehicleType,
//   };

//   if (req.body.location) {
//     bookingUpdate.location = {
//       address: String(req.body.location.address || "").trim(),

//       city: String(req.body.location.city || "").trim(),
//     };
//   }

//   await syncBookingFromLesson(lesson, bookingUpdate);

//   await createNotificationsSafely([
//     {
//       user: lesson.student,

//       title: "Lesson updated",

//       message: "Your lesson schedule has been updated by an admin.",

//       type: "lesson",

//       actionUrl: `/student/lessons/${lesson._id}`,
//     },

//     {
//       user: lesson.teacher,

//       title: "Lesson updated",

//       message: "A lesson schedule assigned to you has been updated.",

//       type: "lesson",

//       actionUrl: `/teacher/lessons/${lesson._id}`,
//     },
//   ]);

//   const updatedLesson = await populateLesson(Lesson.findById(lesson._id));

//   return sendResponse(res, 200, "Lesson updated successfully.", updatedLesson);
// });

// /**
//  * PATCH /api/lessons/:id/start
//  */
// export const startLesson = asyncHandler(async (req, res) => {
//   const lesson = await Lesson.findById(req.params.id);

//   if (!lesson) {
//     throw new ApiError(404, "Lesson not found.");
//   }

//   const isAssignedTeacher = getId(lesson.teacher) === getId(req.user);

//   if (req.user.role !== "admin" && !isAssignedTeacher) {
//     throw new ApiError(403, "You are not allowed to start this lesson.");
//   }

//   if (lesson.status !== "scheduled") {
//     throw new ApiError(400, "Only a scheduled lesson can be started.");
//   }

//   lesson.status = "in_progress";

//   await lesson.save();

//   await createNotificationsSafely([
//     {
//       user: lesson.student,

//       title: "Confirm lesson attendance",

//       message: "Please confirm your attendance for the lesson.",

//       type: "attendance",

//       actionUrl: `/student/lessons/${lesson._id}`,

//       scheduledAt: new Date(),
//     },

//     {
//       user: lesson.teacher,

//       title: "Confirm lesson attendance",

//       message: "Please confirm your attendance for the lesson.",

//       type: "attendance",

//       actionUrl: `/teacher/lessons/${lesson._id}`,

//       scheduledAt: new Date(),
//     },
//   ]);

//   const updatedLesson = await populateLesson(Lesson.findById(lesson._id));

//   return sendResponse(res, 200, "Lesson started successfully.", updatedLesson);
// });

// /**
//  * PATCH /api/lessons/:id/attendance
//  */
// export const confirmAttendance = asyncHandler(async (req, res) => {
//   const lesson = await Lesson.findById(req.params.id);

//   if (!lesson) {
//     throw new ApiError(404, "Lesson not found.");
//   }

//   const isStudent = getId(lesson.student) === getId(req.user);

//   const isTeacher = getId(lesson.teacher) === getId(req.user);

//   const isAdmin = req.user.role === "admin";

//   if (!isStudent && !isTeacher && !isAdmin) {
//     throw new ApiError(
//       403,
//       "You are not allowed to confirm attendance for this lesson.",
//     );
//   }

//   if (lesson.status !== "in_progress") {
//     throw new ApiError(
//       400,
//       "Attendance can only be confirmed for an in-progress lesson.",
//     );
//   }

//   if (isStudent || (isAdmin && req.body.participant === "student")) {
//     lesson.attendance.studentConfirmed = true;

//     lesson.attendance.studentConfirmedAt = new Date();
//   }

//   if (isTeacher || (isAdmin && req.body.participant === "teacher")) {
//     lesson.attendance.teacherConfirmed = true;

//     lesson.attendance.teacherConfirmedAt = new Date();
//   }

//   await lesson.save();

//   const updatedLesson = await populateLesson(Lesson.findById(lesson._id));

//   return sendResponse(
//     res,
//     200,
//     "Attendance confirmed successfully.",
//     updatedLesson,
//   );
// });

// /**
//  * PATCH /api/lessons/:id/complete
//  *
//  * Body example:
//  *
//  * {
//  *   "lessonProgress": {
//  *     "skillsCovered": [
//  *       "Parking",
//  *       "Lane Changing"
//  *     ],
//  *     "teacherNotes": "Good progress"
//  *   }
//  * }
//  */
// export const completeLesson = asyncHandler(async (req, res) => {
//   const lesson = await Lesson.findById(req.params.id);

//   if (!lesson) {
//     throw new ApiError(404, "Lesson not found.");
//   }

//   const isAssignedTeacher = getId(lesson.teacher) === getId(req.user);

//   if (req.user.role !== "admin" && !isAssignedTeacher) {
//     throw new ApiError(403, "You are not allowed to complete this lesson.");
//   }

//   if (!["scheduled", "in_progress"].includes(lesson.status)) {
//     throw new ApiError(400, "This lesson cannot be completed.");
//   }

//   const lessonProgress = req.body.lessonProgress || {};

//   if (Array.isArray(lessonProgress.skillsCovered)) {
//     lesson.lessonProgress.skillsCovered = lessonProgress.skillsCovered
//       .map((skill) => String(skill).trim())
//       .filter(Boolean);
//   }

//   if (lessonProgress.teacherNotes !== undefined) {
//     lesson.lessonProgress.teacherNotes = String(
//       lessonProgress.teacherNotes,
//     ).trim();
//   }

//   lesson.status = "completed";

//   await lesson.save();

//   await syncBookingFromLesson(lesson, {
//     status: "completed",
//   });

//   await createNotificationsSafely({
//     user: lesson.student,

//     title: "Lesson completed",

//     message: "Your lesson has been marked as completed.",

//     type: "lesson",

//     actionUrl: `/student/lessons/${lesson._id}`,
//   });

//   const updatedLesson = await populateLesson(Lesson.findById(lesson._id));

//   return sendResponse(
//     res,
//     200,
//     "Lesson completed successfully.",
//     updatedLesson,
//   );
// });

// /**
//  * PATCH /api/lessons/:id/cancel
//  *
//  * শুধু admin cancel করবে।
//  */
// export const cancelLesson = asyncHandler(async (req, res) => {
//   const lesson = await Lesson.findById(req.params.id);

//   if (!lesson) {
//     throw new ApiError(404, "Lesson not found.");
//   }

//   if (lesson.status === "completed") {
//     throw new ApiError(400, "Completed lesson cannot be cancelled.");
//   }

//   if (lesson.status === "cancelled") {
//     throw new ApiError(400, "Lesson is already cancelled.");
//   }

//   const reason = String(req.body.reason || "").trim();

//   if (!reason) {
//     throw new ApiError(400, "Cancellation reason is required.");
//   }

//   lesson.status = "cancelled";

//   await lesson.save();

//   await syncBookingFromLesson(lesson, {
//     status: "cancelled",

//     cancellation: {
//       cancelledBy: req.user._id,

//       reason,

//       cancelledAt: new Date(),
//     },
//   });

//   await createNotificationsSafely([
//     {
//       user: lesson.student,

//       title: "Lesson cancelled",

//       message: `Your lesson was cancelled. Reason: ${reason}`,

//       type: "lesson",

//       actionUrl: "/student/lessons",
//     },

//     {
//       user: lesson.teacher,

//       title: "Lesson cancelled",

//       message: `A lesson was cancelled. Reason: ${reason}`,

//       type: "lesson",

//       actionUrl: "/teacher/lessons",
//     },
//   ]);

//   const updatedLesson = await populateLesson(Lesson.findById(lesson._id));

//   return sendResponse(
//     res,
//     200,
//     "Lesson cancelled successfully.",
//     updatedLesson,
//   );
// });

import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const LESSON_STATUSES = [
  "scheduled",
  "in_progress",
  "awaiting_confirmation",
  "completed",
  "cancelled",
  "no_show",
];

const ACTIVE_LESSON_STATUSES = [
  "scheduled",
  "in_progress",
  "awaiting_confirmation",
];

const VEHICLE_TYPES = ["manual", "automatic", "electric"];
const ATTENDANCE_STATUSES = ["present", "absent", "disputed"];

const getPolicyMinutes = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const getScheduledDateTime = (lessonDate, time) => {
  const date = new Date(lessonDate);
  const minutes = timeToMinutes(time);
  const timezoneOffset = Number(
    process.env.LESSON_TIMEZONE_OFFSET_MINUTES || 0,
  );
  const safeOffset = Number.isFinite(timezoneOffset) ? timezoneOffset : 0;

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      Math.floor(minutes / 60),
      minutes % 60,
    ) -
      safeOffset * 60 * 1000,
  );
};

const ensureScheduleHasLeadTime = (lessonDate, startTime) => {
  const minimumLeadMinutes = getPolicyMinutes(
    "LESSON_MIN_BOOKING_LEAD_MINUTES",
    60,
  );
  const startsAt = getScheduledDateTime(lessonDate, startTime);

  if (startsAt.getTime() < Date.now() + minimumLeadMinutes * 60 * 1000) {
    throw new ApiError(
      400,
      `Lesson must be scheduled at least ${minimumLeadMinutes} minutes in advance.`,
    );
  }
};

const ensureChangeWindowIsOpen = (lesson, action) => {
  const cutoffMinutes = getPolicyMinutes(
    "LESSON_CHANGE_CUTOFF_MINUTES",
    24 * 60,
  );
  const startsAt = getScheduledDateTime(lesson.lessonDate, lesson.startTime);

  if (startsAt.getTime() - Date.now() < cutoffMinutes * 60 * 1000) {
    throw new ApiError(
      400,
      `${action} requests must be submitted at least ${cutoffMinutes} minutes before the lesson.`,
    );
  }
};

const getId = (value) => String(value?._id || value || "");

const getDayRange = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Invalid lesson date.");
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { date, start, end };
};

const timeToMinutes = (value) => {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new ApiError(400, "Time must use HH:mm format.");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    throw new ApiError(400, "Invalid time value.");
  }

  return hours * 60 + minutes;
};

const calculateDuration = (startTime, endTime) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (end <= start) {
    throw new ApiError(400, "End time must be after start time.");
  }

  return end - start;
};

const cleanStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const populateLesson = (query) => {
  return query
    .populate("student", "name email phone avatar status role")
    .populate("teacher", "name email phone avatar status role")
    .populate("rescheduleRequest.requestedBy", "name email role")
    .populate("rescheduleRequest.resolvedBy", "name email role")
    .populate("cancellationRequest.requestedBy", "name email role")
    .populate("cancellationRequest.resolvedBy", "name email role")
    .populate({
      path: "booking",
      populate: {
        path: "offer",
        select: "title salePrice category",
      },
    });
};

const canAccessLesson = (user, lesson) => {
  if (user.role === "admin") return true;
  if (user.role === "student") {
    return getId(lesson.student) === getId(user);
  }
  if (user.role === "teacher") {
    return getId(lesson.teacher) === getId(user);
  }
  return false;
};

const findActiveUser = async (userId, role, label) => {
  const user = await User.findOne({
    _id: userId,
    role,
    status: "active",
  });

  if (!user) {
    throw new ApiError(400, `${label} is not available.`);
  }

  return user;
};

const ensureNoScheduleConflict = async ({
  student,
  teacher,
  lessonDate,
  startTime,
  endTime,
  excludeLessonId = null,
}) => {
  const { start, end } = getDayRange(lessonDate);

  const filter = {
    status: { $in: ACTIVE_LESSON_STATUSES },
    lessonDate: { $gte: start, $lte: end },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    $or: [{ student }, { teacher }],
  };

  if (excludeLessonId) {
    filter._id = { $ne: excludeLessonId };
  }

  const conflict = await Lesson.findOne(filter).select(
    "student teacher lessonDate startTime endTime",
  );

  if (!conflict) return;

  if (getId(conflict.teacher) === getId(teacher)) {
    throw new ApiError(
      409,
      "The selected teacher already has another lesson at this time.",
    );
  }

  throw new ApiError(
    409,
    "The selected student already has another lesson at this time.",
  );
};

const createNotificationsSafely = async (notifications) => {
  try {
    const payload = Array.isArray(notifications)
      ? notifications
      : [notifications];
    if (payload.length) await Notification.create(payload);
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

const notifyAdminsSafely = async ({ title, message, actionUrl }) => {
  try {
    const admins = await User.find({ role: "admin", status: "active" }).select(
      "_id",
    );
    if (!admins.length) return;

    await Notification.create(
      admins.map((admin) => ({
        user: admin._id,
        title,
        message,
        type: "lesson",
        actionUrl,
      })),
    );
  } catch (error) {
    console.error("Admin notification creation failed:", error.message);
  }
};

const syncBookingFromLesson = async (lesson, extra = {}) => {
  const bookingId = getId(lesson.booking);
  if (!bookingId) return;

  await Booking.findByIdAndUpdate(
    bookingId,
    {
      teacher: lesson.teacher,
      bookingDate: lesson.lessonDate,
      startTime: lesson.startTime,
      endTime: lesson.endTime,
      duration: lesson.duration,
      ...extra,
    },
    { runValidators: true },
  );
};

const addHistory = (lesson, action, user, note = "") => {
  lesson.history.push({
    action,
    by: user?._id || user,
    note: String(note || "").trim(),
  });
};

const buildRoleFilter = (user) => {
  if (user.role === "student") return { student: user._id };
  if (user.role === "teacher") return { teacher: user._id };
  return {};
};

export const getLessons = asyncHandler(async (req, res) => {
  const filter = buildRoleFilter(req.user);

  if (req.query.status && req.query.status !== "all") {
    if (!LESSON_STATUSES.includes(req.query.status)) {
      throw new ApiError(400, "Invalid lesson status filter.");
    }
    filter.status = req.query.status;
  }

  if (req.user.role === "admin" && req.query.student) {
    filter.student = req.query.student;
  }

  if (req.user.role === "admin" && req.query.teacher) {
    filter.teacher = req.query.teacher;
  }

  if (req.query.requestType === "reschedule") {
    filter["rescheduleRequest.status"] = "pending";
  }

  if (req.query.requestType === "cancellation") {
    filter["cancellationRequest.status"] = "pending";
  }

  if (req.query.dateFrom || req.query.dateTo) {
    filter.lessonDate = {};
    if (req.query.dateFrom) {
      filter.lessonDate.$gte = getDayRange(req.query.dateFrom).start;
    }
    if (req.query.dateTo) {
      filter.lessonDate.$lte = getDayRange(req.query.dateTo).end;
    }
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  const skip = (page - 1) * limit;

  const [lessons, total] = await Promise.all([
    populateLesson(
      Lesson.find(filter)
        .sort({ lessonDate: -1, startTime: -1 })
        .skip(skip)
        .limit(limit),
    ),
    Lesson.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Lessons fetched successfully.", lessons, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

export const getLessonStats = asyncHandler(async (req, res) => {
  const filter = buildRoleFilter(req.user);

  const [statusCounts, pendingReschedules, pendingCancellations] =
    await Promise.all([
      Lesson.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Lesson.countDocuments({
        ...filter,
        "rescheduleRequest.status": "pending",
      }),
      Lesson.countDocuments({
        ...filter,
        "cancellationRequest.status": "pending",
      }),
    ]);

  const stats = LESSON_STATUSES.reduce(
    (result, status) => ({ ...result, [status]: 0 }),
    {},
  );

  statusCounts.forEach((item) => {
    stats[item._id] = item.count;
  });

  stats.total = statusCounts.reduce((sum, item) => sum + item.count, 0);
  stats.pendingReschedules = pendingReschedules;
  stats.pendingCancellations = pendingCancellations;

  return sendResponse(res, 200, "Lesson statistics fetched.", stats);
});

export const getLesson = asyncHandler(async (req, res) => {
  const lesson = await populateLesson(Lesson.findById(req.params.id));

  if (!lesson) throw new ApiError(404, "Lesson not found.");
  if (!canAccessLesson(req.user, lesson)) {
    throw new ApiError(403, "You are not allowed to access this lesson.");
  }

  return sendResponse(res, 200, "Lesson fetched successfully.", lesson);
});

export const createLesson = asyncHandler(async (req, res) => {
  const {
    student,
    teacher,
    lessonDate,
    startTime,
    endTime,
    vehicleType,
    location = {},
    paymentStatus = "paid",
  } = req.body;

  if (
    !student ||
    !teacher ||
    !lessonDate ||
    !startTime ||
    !endTime ||
    !vehicleType
  ) {
    throw new ApiError(
      400,
      "Student, teacher, date, start time, end time and vehicle type are required.",
    );
  }

  if (!VEHICLE_TYPES.includes(vehicleType)) {
    throw new ApiError(400, "Vehicle type must be manual or automatic.");
  }

  if (!["paid", "unpaid"].includes(paymentStatus)) {
    throw new ApiError(400, "Payment status must be paid or unpaid.");
  }

  const [selectedStudent, selectedTeacher] = await Promise.all([
    findActiveUser(student, "student", "Selected student"),
    findActiveUser(teacher, "teacher", "Selected teacher"),
  ]);

  const { date } = getDayRange(lessonDate);
  const duration = calculateDuration(startTime, endTime);
  ensureScheduleHasLeadTime(date, startTime);

  await ensureNoScheduleConflict({
    student: selectedStudent._id,
    teacher: selectedTeacher._id,
    lessonDate: date,
    startTime,
    endTime,
  });

  const booking = await Booking.create({
    student: selectedStudent._id,
    teacher: selectedTeacher._id,
    location: {
      address: String(location?.address || "").trim(),
      city: String(location?.city || "").trim(),
      lat: Number.isFinite(Number(location?.lat))
        ? Number(location.lat)
        : undefined,
      lng: Number.isFinite(Number(location?.lng))
        ? Number(location.lng)
        : undefined,
    },
    vehicleType,
    bookingDate: date,
    startTime,
    endTime,
    duration,
    status: "confirmed",
    paymentStatus,
  });

  let lesson;

  try {
    lesson = await Lesson.create({
      booking: booking._id,
      student: selectedStudent._id,
      teacher: selectedTeacher._id,
      lessonDate: date,
      startTime,
      endTime,
      duration,
      status: "scheduled",
      history: [
        {
          action: "lesson_scheduled",
          by: req.user._id,
          note: "Lesson scheduled by admin.",
        },
      ],
    });
  } catch (error) {
    await Booking.findByIdAndDelete(booking._id);
    throw error;
  }

  await createNotificationsSafely([
    {
      user: selectedStudent._id,
      title: "Lesson scheduled",
      message: `Your lesson is scheduled for ${startTime}.`,
      type: "lesson",
      actionUrl: `/student/lessons`,
    },
    {
      user: selectedTeacher._id,
      title: "New lesson assigned",
      message: `A lesson has been assigned for ${startTime}.`,
      type: "lesson",
      actionUrl: `/teacher/lessons`,
    },
  ]);

  const createdLesson = await populateLesson(Lesson.findById(lesson._id));

  return sendResponse(
    res,
    201,
    "Lesson scheduled successfully.",
    createdLesson,
  );
});

export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  if (["completed", "cancelled", "no_show"].includes(lesson.status)) {
    throw new ApiError(400, "This lesson can no longer be edited.");
  }

  const booking = await Booking.findById(lesson.booking);
  const teacherId = req.body.teacher || lesson.teacher;
  const lessonDate = req.body.lessonDate || lesson.lessonDate;
  const startTime = req.body.startTime || lesson.startTime;
  const endTime = req.body.endTime || lesson.endTime;
  const vehicleType = req.body.vehicleType || booking?.vehicleType;

  if (!VEHICLE_TYPES.includes(vehicleType)) {
    throw new ApiError(400, "Vehicle type must be manual or automatic.");
  }

  const selectedTeacher = await findActiveUser(
    teacherId,
    "teacher",
    "Selected teacher",
  );

  const { date } = getDayRange(lessonDate);
  const duration = calculateDuration(startTime, endTime);
  ensureScheduleHasLeadTime(date, startTime);

  await ensureNoScheduleConflict({
    student: lesson.student,
    teacher: selectedTeacher._id,
    lessonDate: date,
    startTime,
    endTime,
    excludeLessonId: lesson._id,
  });

  lesson.teacher = selectedTeacher._id;
  lesson.lessonDate = date;
  lesson.startTime = startTime;
  lesson.endTime = endTime;
  lesson.duration = duration;
  lesson.status = "scheduled";
  lesson.rescheduleRequest = { status: "none" };
  addHistory(lesson, "lesson_updated", req.user, "Schedule updated by admin.");
  await lesson.save();

  const bookingUpdate = { vehicleType };

  if (req.body.location) {
    bookingUpdate.location = {
      address: String(req.body.location.address || "").trim(),
      city: String(req.body.location.city || "").trim(),
      lat: Number.isFinite(Number(req.body.location.lat))
        ? Number(req.body.location.lat)
        : undefined,
      lng: Number.isFinite(Number(req.body.location.lng))
        ? Number(req.body.location.lng)
        : undefined,
    };
  }

  if (req.body.paymentStatus) {
    if (!["paid", "unpaid", "refunded"].includes(req.body.paymentStatus)) {
      throw new ApiError(400, "Invalid payment status.");
    }
    bookingUpdate.paymentStatus = req.body.paymentStatus;
  }

  await syncBookingFromLesson(lesson, bookingUpdate);

  await createNotificationsSafely([
    {
      user: lesson.student,
      title: "Lesson updated",
      message: "Your lesson schedule has been updated by an admin.",
      type: "lesson",
      actionUrl: "/student/lessons",
    },
    {
      user: lesson.teacher,
      title: "Lesson updated",
      message: "A lesson assigned to you has been updated.",
      type: "lesson",
      actionUrl: "/teacher/lessons",
    },
  ]);

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(res, 200, "Lesson updated successfully.", updatedLesson);
});

export const startLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  const isAssignedTeacher = getId(lesson.teacher) === getId(req.user);
  if (req.user.role !== "admin" && !isAssignedTeacher) {
    throw new ApiError(403, "You are not allowed to start this lesson.");
  }

  if (lesson.status !== "scheduled") {
    throw new ApiError(400, "Only a scheduled lesson can be started.");
  }

  if (req.user.role !== "admin") {
    const startsAt = getScheduledDateTime(lesson.lessonDate, lesson.startTime);
    const endsAt = getScheduledDateTime(lesson.lessonDate, lesson.endTime);
    const earlyMinutes = getPolicyMinutes("LESSON_START_EARLY_MINUTES", 15);
    const lateMinutes = getPolicyMinutes("LESSON_START_LATE_MINUTES", 60);
    const now = Date.now();

    if (now < startsAt.getTime() - earlyMinutes * 60 * 1000) {
      throw new ApiError(
        400,
        `Lesson can only be started ${earlyMinutes} minutes before its scheduled time.`,
      );
    }

    if (now > endsAt.getTime() + lateMinutes * 60 * 1000) {
      throw new ApiError(
        400,
        "The start window has passed. Ask an admin to review this lesson.",
      );
    }
  }

  lesson.status = "in_progress";
  lesson.startedAt = new Date();
  addHistory(lesson, "lesson_started", req.user, "Lesson started.");
  await lesson.save();

  await createNotificationsSafely([
    {
      user: lesson.student,
      title: "Confirm lesson attendance",
      message: "Your lesson has started. Please confirm your attendance.",
      type: "attendance",
      actionUrl: "/student/lessons",
      scheduledAt: new Date(),
    },
    {
      user: lesson.teacher,
      title: "Confirm lesson attendance",
      message: "Please confirm your attendance for the lesson.",
      type: "attendance",
      actionUrl: "/teacher/lessons",
      scheduledAt: new Date(),
    },
  ]);

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(res, 200, "Lesson started successfully.", updatedLesson);
});

export const confirmAttendance = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  const isStudent = getId(lesson.student) === getId(req.user);
  const isTeacher = getId(lesson.teacher) === getId(req.user);
  const isAdmin = req.user.role === "admin";

  if (!isStudent && !isTeacher && !isAdmin) {
    throw new ApiError(
      403,
      "You are not allowed to confirm attendance for this lesson.",
    );
  }

  if (!["in_progress", "awaiting_confirmation"].includes(lesson.status)) {
    throw new ApiError(
      400,
      "Attendance can only be recorded for an active lesson.",
    );
  }

  const attendanceStatus = req.body.status || "present";
  if (!ATTENDANCE_STATUSES.includes(attendanceStatus)) {
    throw new ApiError(400, "Invalid attendance status.");
  }

  const participant = isAdmin ? req.body.participant : req.user.role;

  if (!["student", "teacher"].includes(participant)) {
    throw new ApiError(400, "Participant must be student or teacher.");
  }

  if (participant === "student") {
    lesson.attendance.studentStatus = attendanceStatus;
    lesson.attendance.studentConfirmed = attendanceStatus === "present";
    lesson.attendance.studentConfirmedAt = new Date();
  }

  if (participant === "teacher") {
    lesson.attendance.teacherStatus = attendanceStatus;
    lesson.attendance.teacherConfirmed = attendanceStatus === "present";
    lesson.attendance.teacherConfirmedAt = new Date();
  }

  if (isAdmin) {
    lesson.attendance.finalisedByAdmin = true;
    lesson.attendance.adminNote = String(req.body.adminNote || "").trim();
  }

  addHistory(
    lesson,
    "attendance_recorded",
    req.user,
    `${participant}: ${attendanceStatus}`,
  );
  await lesson.save();

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    "Attendance recorded successfully.",
    updatedLesson,
  );
});

export const completeLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  const isAssignedTeacher = getId(lesson.teacher) === getId(req.user);
  const isAdmin = req.user.role === "admin";

  if (!isAdmin && !isAssignedTeacher) {
    throw new ApiError(403, "You are not allowed to complete this lesson.");
  }

  if (!isAdmin && lesson.status !== "in_progress") {
    throw new ApiError(400, "Start the lesson before submitting its report.");
  }

  if (
    isAdmin &&
    !["scheduled", "in_progress", "awaiting_confirmation"].includes(
      lesson.status,
    )
  ) {
    throw new ApiError(400, "This lesson cannot be completed.");
  }

  if (!isAdmin && lesson.attendance?.teacherStatus !== "present") {
    throw new ApiError(
      400,
      "Confirm your attendance before submitting the lesson report.",
    );
  }

  const progress = req.body.lessonProgress || req.body || {};

  if (
    !isAdmin &&
    (!Array.isArray(progress.skillsCovered) ||
      !cleanStringArray(progress.skillsCovered).length ||
      !String(progress.teacherNotes || "").trim())
  ) {
    throw new ApiError(
      400,
      "Teacher notes and at least one covered skill are required.",
    );
  }

  if (Array.isArray(progress.skillsCovered)) {
    lesson.lessonProgress.skillsCovered = cleanStringArray(
      progress.skillsCovered,
    );
  }

  if (progress.teacherNotes !== undefined) {
    lesson.lessonProgress.teacherNotes = String(progress.teacherNotes).trim();
  }

  if (progress.areasToImprove !== undefined) {
    lesson.lessonProgress.areasToImprove = Array.isArray(
      progress.areasToImprove,
    )
      ? cleanStringArray(progress.areasToImprove)
      : String(progress.areasToImprove)
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean);
  }

  if (progress.nextLessonRecommendation !== undefined) {
    lesson.lessonProgress.nextLessonRecommendation = String(
      progress.nextLessonRecommendation,
    ).trim();
  }

  const performance = progress.performance ?? progress.studentPerformance;
  if (performance !== undefined) {
    const allowed = [
      "not_assessed",
      "needs_improvement",
      "satisfactory",
      "good",
      "excellent",
    ];
    if (!allowed.includes(performance)) {
      throw new ApiError(400, "Invalid performance value.");
    }
    lesson.lessonProgress.performance = performance;
  }

  lesson.lessonProgress.teacherSubmittedAt = new Date();

  const finalizeNow = isAdmin && req.body.finalize === true;
  lesson.status = finalizeNow ? "completed" : "awaiting_confirmation";

  if (finalizeNow) {
    lesson.completedAt = new Date();
    await syncBookingFromLesson(lesson, { status: "completed" });
  }

  addHistory(
    lesson,
    finalizeNow ? "lesson_completed_by_admin" : "teacher_report_submitted",
    req.user,
    progress.teacherNotes || "",
  );
  await lesson.save();

  await createNotificationsSafely({
    user: lesson.student,
    title: finalizeNow ? "Lesson completed" : "Confirm lesson completion",
    message: finalizeNow
      ? "Your lesson has been marked as completed."
      : "Your teacher submitted the lesson report. Please confirm completion.",
    type: "lesson",
    actionUrl: "/student/lessons",
  });

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    finalizeNow
      ? "Lesson completed successfully."
      : "Lesson report submitted. Waiting for student confirmation.",
    updatedLesson,
  );
});

export const confirmLessonCompletion = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  const isStudent = getId(lesson.student) === getId(req.user);
  const isAdmin = req.user.role === "admin";

  if (!isStudent && !isAdmin) {
    throw new ApiError(403, "You cannot confirm this lesson.");
  }

  if (lesson.status !== "awaiting_confirmation") {
    throw new ApiError(400, "This lesson is not waiting for confirmation.");
  }

  if (!isAdmin && lesson.attendance?.studentStatus !== "present") {
    throw new ApiError(
      400,
      "Confirm your attendance before confirming lesson completion.",
    );
  }

  lesson.status = "completed";
  lesson.completedAt = new Date();
  lesson.lessonProgress.studentConfirmedAt = new Date();

  addHistory(lesson, "lesson_completion_confirmed", req.user);
  await lesson.save();
  await syncBookingFromLesson(lesson, { status: "completed" });

  await createNotificationsSafely({
    user: lesson.teacher,
    title: "Lesson confirmed",
    message: "The student confirmed the lesson completion.",
    type: "lesson",
    actionUrl: "/teacher/lessons",
  });

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    "Lesson completion confirmed successfully.",
    updatedLesson,
  );
});

export const submitLessonFeedback = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  const isStudent = getId(lesson.student) === getId(req.user);
  if (!isStudent) {
    throw new ApiError(403, "Only this lesson's student can submit feedback.");
  }

  if (!["awaiting_confirmation", "completed"].includes(lesson.status)) {
    throw new ApiError(400, "Feedback is not available for this lesson.");
  }

  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be an integer from 1 to 5.");
  }

  lesson.lessonProgress.rating = rating;
  lesson.lessonProgress.studentNotes = String(
    req.body.studentNotes || "",
  ).trim();
  lesson.lessonProgress.feedbackSubmittedAt = new Date();

  addHistory(
    lesson,
    "student_feedback_submitted",
    req.user,
    `Rating: ${rating}`,
  );
  await lesson.save();

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    "Feedback submitted successfully.",
    updatedLesson,
  );
});

export const requestReschedule = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  if (!canAccessLesson(req.user, lesson) || req.user.role === "admin") {
    throw new ApiError(403, "You cannot request a reschedule for this lesson.");
  }

  if (lesson.status !== "scheduled") {
    throw new ApiError(400, "Only a scheduled lesson can be rescheduled.");
  }

  if (lesson.rescheduleRequest?.status === "pending") {
    throw new ApiError(400, "A reschedule request is already pending.");
  }

  ensureChangeWindowIsOpen(lesson, "Reschedule");

  const lessonDate = req.body.lessonDate || req.body.requestedDate;
  const startTime = req.body.startTime || req.body.requestedStartTime;
  const endTime = req.body.endTime || req.body.requestedEndTime;
  const reason = req.body.reason;
  if (!lessonDate || !startTime || !endTime || !String(reason || "").trim()) {
    throw new ApiError(
      400,
      "Requested date, start time, end time and reason are required.",
    );
  }

  const { date } = getDayRange(lessonDate);
  calculateDuration(startTime, endTime);
  ensureScheduleHasLeadTime(date, startTime);

  await ensureNoScheduleConflict({
    student: lesson.student,
    teacher: lesson.teacher,
    lessonDate: date,
    startTime,
    endTime,
    excludeLessonId: lesson._id,
  });

  lesson.rescheduleRequest = {
    status: "pending",
    requestedBy: req.user._id,
    requestedAt: new Date(),
    requestedDate: date,
    startTime,
    endTime,
    reason: String(reason).trim(),
  };

  addHistory(lesson, "reschedule_requested", req.user, reason);
  await lesson.save();

  await notifyAdminsSafely({
    title: "Lesson reschedule request",
    message: `${req.user.name} requested a lesson reschedule.`,
    actionUrl: "/admin/lessons",
  });

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    "Reschedule request submitted successfully.",
    updatedLesson,
  );
});

export const resolveReschedule = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  if (lesson.rescheduleRequest?.status !== "pending") {
    throw new ApiError(400, "No pending reschedule request was found.");
  }

  const approve = req.body.approve === true;
  const adminNote = String(req.body.adminNote || "").trim();

  if (approve) {
    const requested = lesson.rescheduleRequest;
    const duration = calculateDuration(requested.startTime, requested.endTime);

    await ensureNoScheduleConflict({
      student: lesson.student,
      teacher: lesson.teacher,
      lessonDate: requested.requestedDate,
      startTime: requested.startTime,
      endTime: requested.endTime,
      excludeLessonId: lesson._id,
    });

    lesson.lessonDate = requested.requestedDate;
    lesson.startTime = requested.startTime;
    lesson.endTime = requested.endTime;
    lesson.duration = duration;
    lesson.rescheduleRequest.status = "approved";
    addHistory(lesson, "reschedule_approved", req.user, adminNote);
    await syncBookingFromLesson(lesson);
  } else {
    lesson.rescheduleRequest.status = "rejected";
    addHistory(lesson, "reschedule_rejected", req.user, adminNote);
  }

  lesson.rescheduleRequest.adminNote = adminNote;
  lesson.rescheduleRequest.resolvedBy = req.user._id;
  lesson.rescheduleRequest.resolvedAt = new Date();
  await lesson.save();

  await createNotificationsSafely([
    {
      user: lesson.student,
      title: approve ? "Reschedule approved" : "Reschedule rejected",
      message: approve
        ? "Your lesson reschedule request was approved."
        : "Your lesson reschedule request was rejected.",
      type: "lesson",
      actionUrl: "/student/lessons",
    },
    {
      user: lesson.teacher,
      title: approve ? "Lesson rescheduled" : "Reschedule request rejected",
      message: approve
        ? "The lesson schedule has been updated."
        : "The lesson reschedule request was rejected.",
      type: "lesson",
      actionUrl: "/teacher/lessons",
    },
  ]);

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    approve ? "Reschedule request approved." : "Reschedule request rejected.",
    updatedLesson,
  );
});

export const requestCancellation = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  if (!canAccessLesson(req.user, lesson) || req.user.role === "admin") {
    throw new ApiError(403, "You cannot request cancellation for this lesson.");
  }

  if (lesson.status !== "scheduled") {
    throw new ApiError(400, "Only a scheduled lesson can be cancelled.");
  }

  if (lesson.cancellationRequest?.status === "pending") {
    throw new ApiError(400, "A cancellation request is already pending.");
  }

  ensureChangeWindowIsOpen(lesson, "Cancellation");

  const reason = String(req.body.reason || "").trim();
  if (!reason) throw new ApiError(400, "Cancellation reason is required.");

  lesson.cancellationRequest = {
    status: "pending",
    requestedBy: req.user._id,
    requestedAt: new Date(),
    reason,
  };

  addHistory(lesson, "cancellation_requested", req.user, reason);
  await lesson.save();

  await notifyAdminsSafely({
    title: "Lesson cancellation request",
    message: `${req.user.name} requested lesson cancellation.`,
    actionUrl: "/admin/lessons",
  });

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    "Cancellation request submitted successfully.",
    updatedLesson,
  );
});

export const resolveCancellation = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  if (lesson.cancellationRequest?.status !== "pending") {
    throw new ApiError(400, "No pending cancellation request was found.");
  }

  const approve = req.body.approve === true;
  const adminNote = String(req.body.adminNote || "").trim();

  lesson.cancellationRequest.status = approve ? "approved" : "rejected";
  lesson.cancellationRequest.adminNote = adminNote;
  lesson.cancellationRequest.resolvedBy = req.user._id;
  lesson.cancellationRequest.resolvedAt = new Date();

  if (approve) {
    const reason =
      lesson.cancellationRequest.reason || "Cancellation approved.";
    lesson.status = "cancelled";
    lesson.cancellation = {
      cancelledBy: req.user._id,
      reason,
      cancelledAt: new Date(),
    };
    addHistory(lesson, "cancellation_approved", req.user, adminNote || reason);

    await syncBookingFromLesson(lesson, {
      status: "cancelled",
      cancellation: {
        cancelledBy: req.user._id,
        reason,
        cancelledAt: new Date(),
      },
    });
  } else {
    addHistory(lesson, "cancellation_rejected", req.user, adminNote);
  }

  await lesson.save();

  await createNotificationsSafely([
    {
      user: lesson.student,
      title: approve ? "Lesson cancelled" : "Cancellation rejected",
      message: approve
        ? "The lesson cancellation request was approved."
        : "The lesson cancellation request was rejected.",
      type: "lesson",
      actionUrl: "/student/lessons",
    },
    {
      user: lesson.teacher,
      title: approve ? "Lesson cancelled" : "Cancellation rejected",
      message: approve
        ? "The lesson cancellation request was approved."
        : "The lesson cancellation request was rejected.",
      type: "lesson",
      actionUrl: "/teacher/lessons",
    },
  ]);

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    approve
      ? "Cancellation request approved."
      : "Cancellation request rejected.",
    updatedLesson,
  );
});

export const cancelLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  if (lesson.status === "completed") {
    throw new ApiError(400, "Completed lesson cannot be cancelled.");
  }

  if (lesson.status === "cancelled") {
    throw new ApiError(400, "Lesson is already cancelled.");
  }

  const reason = String(req.body.reason || "").trim();
  if (!reason) throw new ApiError(400, "Cancellation reason is required.");

  lesson.status = "cancelled";
  lesson.cancellation = {
    cancelledBy: req.user._id,
    reason,
    cancelledAt: new Date(),
  };
  addHistory(lesson, "lesson_cancelled", req.user, reason);
  await lesson.save();

  await syncBookingFromLesson(lesson, {
    status: "cancelled",
    cancellation: {
      cancelledBy: req.user._id,
      reason,
      cancelledAt: new Date(),
    },
  });

  await createNotificationsSafely([
    {
      user: lesson.student,
      title: "Lesson cancelled",
      message: `Your lesson was cancelled. Reason: ${reason}`,
      type: "lesson",
      actionUrl: "/student/lessons",
    },
    {
      user: lesson.teacher,
      title: "Lesson cancelled",
      message: `A lesson was cancelled. Reason: ${reason}`,
      type: "lesson",
      actionUrl: "/teacher/lessons",
    },
  ]);

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    "Lesson cancelled successfully.",
    updatedLesson,
  );
});

export const markNoShow = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  const isAssignedTeacher = getId(lesson.teacher) === getId(req.user);
  const isAdmin = req.user.role === "admin";

  if (!isAdmin && !isAssignedTeacher) {
    throw new ApiError(403, "You cannot mark no-show for this lesson.");
  }

  if (!["scheduled", "in_progress"].includes(lesson.status)) {
    throw new ApiError(400, "No-show cannot be recorded for this lesson.");
  }

  if (!isAdmin) {
    const startsAt = getScheduledDateTime(lesson.lessonDate, lesson.startTime);
    const graceMinutes = getPolicyMinutes("LESSON_NO_SHOW_GRACE_MINUTES", 15);
    if (Date.now() < startsAt.getTime() + graceMinutes * 60 * 1000) {
      throw new ApiError(
        400,
        `No-show can only be recorded ${graceMinutes} minutes after the scheduled start time.`,
      );
    }
  }

  const participant = req.body.participant || "student";
  if (!["student", "teacher"].includes(participant)) {
    throw new ApiError(400, "Participant must be student or teacher.");
  }

  if (!isAdmin && participant !== "student") {
    throw new ApiError(403, "A teacher may only mark a student no-show.");
  }

  const reason = String(req.body.reason || req.body.note || "No-show").trim();

  lesson.status = "no_show";
  lesson.attendance.studentStatus =
    participant === "student" ? "absent" : "present";
  lesson.attendance.teacherStatus =
    participant === "teacher" ? "absent" : "present";
  addHistory(lesson, "no_show_recorded", req.user, `${participant}: ${reason}`);
  await lesson.save();

  await syncBookingFromLesson(lesson, { status: "no_show" });

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));
  return sendResponse(
    res,
    200,
    "No-show recorded successfully.",
    updatedLesson,
  );
});
