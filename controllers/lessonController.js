// import Booking from "../models/Booking.js";
// import Lesson from "../models/Lesson.js";
// import Notification from "../models/Notification.js";
// import User from "../models/User.js";
// import ApiError from "../utils/ApiError.js";
// import sendResponse from "../utils/ApiResponse.js";
// import asyncHandler from "../utils/asyncHandler.js";

// const LESSON_STATUSES = [
//   "scheduled",
//   "in_progress",
//   "completed",
//   "cancelled",
// ];

// const ACTIVE_LESSON_STATUSES = [
//   "scheduled",
//   "in_progress",
// ];

// const VEHICLE_TYPES = [
//   "manual",
//   "automatic",
// ];

// const getId = (value) => {
//   return String(
//     value?._id ||
//     value ||
//     "",
//   );
// };

// const getDayRange = (value) => {
//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     throw new ApiError(
//       400,
//       "Invalid lesson date.",
//     );
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
//   const match = String(
//     value || "",
//   ).match(/^(\d{2}):(\d{2})$/);

//   if (!match) {
//     throw new ApiError(
//       400,
//       "Time must use HH:mm format.",
//     );
//   }

//   const hours = Number(match[1]);
//   const minutes = Number(match[2]);

//   if (
//     hours > 23 ||
//     minutes > 59
//   ) {
//     throw new ApiError(
//       400,
//       "Invalid time value.",
//     );
//   }

//   return hours * 60 + minutes;
// };

// const calculateDuration = (
//   startTime,
//   endTime,
// ) => {
//   const start =
//     timeToMinutes(startTime);

//   const end =
//     timeToMinutes(endTime);

//   if (end <= start) {
//     throw new ApiError(
//       400,
//       "End time must be after start time.",
//     );
//   }

//   return end - start;
// };

// const populateLesson = (query) => {
//   return query
//     .populate(
//       "student",
//       "name email phone avatar status",
//     )
//     .populate(
//       "teacher",
//       "name email phone avatar status",
//     )
//     .populate({
//       path: "booking",
//       populate: {
//         path: "offer",
//         select:
//           "title salePrice category",
//       },
//     });
// };

// const canAccessLesson = (
//   user,
//   lesson,
// ) => {
//   if (user.role === "admin") {
//     return true;
//   }

//   if (user.role === "student") {
//     return (
//       getId(lesson.student) ===
//       getId(user)
//     );
//   }

//   if (user.role === "teacher") {
//     return (
//       getId(lesson.teacher) ===
//       getId(user)
//     );
//   }

//   return false;
// };

// const findActiveUser = async (
//   userId,
//   role,
//   label,
// ) => {
//   const user = await User.findOne({
//     _id: userId,
//     role,
//     status: "active",
//   });

//   if (!user) {
//     throw new ApiError(
//       400,
//       `${label} is not available.`,
//     );
//   }

//   return user;
// };

// /**
//  * একই teacher অথবা student-এর একই সময়ে
//  * আরেকটি active lesson আছে কি না check করবে।
//  */
// const ensureNoScheduleConflict =
//   async ({
//     student,
//     teacher,
//     lessonDate,
//     startTime,
//     endTime,
//     excludeLessonId = null,
//   }) => {
//     const {
//       start,
//       end,
//     } = getDayRange(lessonDate);

//     const filter = {
//       status: {
//         $in: ACTIVE_LESSON_STATUSES,
//       },

//       lessonDate: {
//         $gte: start,
//         $lte: end,
//       },

//       /**
//        * Existing lesson:
//        * 09:00 - 10:00
//        *
//        * New lesson:
//        * 09:30 - 10:30
//        *
//        * এটি conflict হিসেবে ধরা হবে।
//        */
//       startTime: {
//         $lt: endTime,
//       },

//       endTime: {
//         $gt: startTime,
//       },

//       $or: [
//         {
//           student,
//         },
//         {
//           teacher,
//         },
//       ],
//     };

//     if (excludeLessonId) {
//       filter._id = {
//         $ne: excludeLessonId,
//       };
//     }

//     const conflict =
//       await Lesson.findOne(
//         filter,
//       ).select(
//         "student teacher lessonDate startTime endTime",
//       );

//     if (!conflict) {
//       return;
//     }

//     if (
//       getId(conflict.teacher) ===
//       getId(teacher)
//     ) {
//       throw new ApiError(
//         409,
//         "The selected teacher already has another lesson at this time.",
//       );
//     }

//     throw new ApiError(
//       409,
//       "The selected student already has another lesson at this time.",
//     );
//   };

// /**
//  * Notification fail হলেও মূল lesson action fail করবে না।
//  */
// const createNotificationsSafely =
//   async (notifications) => {
//     try {
//       await Notification.create(
//         notifications,
//       );
//     } catch (error) {
//       console.error(
//         "Notification creation failed:",
//         error.message,
//       );
//     }
//   };

// /**
//  * Lesson update হলে linked booking-ও update করবে।
//  */
// const syncBookingFromLesson =
//   async (
//     lesson,
//     extra = {},
//   ) => {
//     const bookingId =
//       getId(lesson.booking);

//     if (!bookingId) {
//       return;
//     }

//     await Booking.findByIdAndUpdate(
//       bookingId,
//       {
//         teacher: lesson.teacher,
//         bookingDate:
//           lesson.lessonDate,
//         startTime:
//           lesson.startTime,
//         endTime:
//           lesson.endTime,
//         duration:
//           lesson.duration,
//         ...extra,
//       },
//       {
//         runValidators: true,
//       },
//     );
//   };

// /**
//  * GET /api/lessons
//  *
//  * Admin: সব lesson
//  * Student: নিজের lesson
//  * Teacher: assigned lesson
//  */
// export const getLessons =
//   asyncHandler(async (req, res) => {
//     const filter = {};

//     if (
//       req.user.role === "student"
//     ) {
//       filter.student =
//         req.user._id;
//     }

//     if (
//       req.user.role === "teacher"
//     ) {
//       filter.teacher =
//         req.user._id;
//     }

//     if (
//       req.query.status &&
//       req.query.status !== "all"
//     ) {
//       if (
//         !LESSON_STATUSES.includes(
//           req.query.status,
//         )
//       ) {
//         throw new ApiError(
//           400,
//           "Invalid lesson status filter.",
//         );
//       }

//       filter.status =
//         req.query.status;
//     }

//     if (
//       req.user.role === "admin" &&
//       req.query.student
//     ) {
//       filter.student =
//         req.query.student;
//     }

//     if (
//       req.user.role === "admin" &&
//       req.query.teacher
//     ) {
//       filter.teacher =
//         req.query.teacher;
//     }

//     if (
//       req.query.dateFrom ||
//       req.query.dateTo
//     ) {
//       filter.lessonDate = {};

//       if (req.query.dateFrom) {
//         filter.lessonDate.$gte =
//           getDayRange(
//             req.query.dateFrom,
//           ).start;
//       }

//       if (req.query.dateTo) {
//         filter.lessonDate.$lte =
//           getDayRange(
//             req.query.dateTo,
//           ).end;
//       }
//     }

//     const lessons =
//       await populateLesson(
//         Lesson.find(
//           filter,
//         ).sort({
//           lessonDate: -1,
//           startTime: -1,
//         }),
//       );

//     return sendResponse(
//       res,
//       200,
//       "Lessons fetched successfully.",
//       lessons,
//     );
//   });

// /**
//  * GET /api/lessons/:id
//  */
// export const getLesson =
//   asyncHandler(async (req, res) => {
//     const lesson =
//       await populateLesson(
//         Lesson.findById(
//           req.params.id,
//         ),
//       );

//     if (!lesson) {
//       throw new ApiError(
//         404,
//         "Lesson not found.",
//       );
//     }

//     if (
//       !canAccessLesson(
//         req.user,
//         lesson,
//       )
//     ) {
//       throw new ApiError(
//         403,
//         "You are not allowed to access this lesson.",
//       );
//     }

//     return sendResponse(
//       res,
//       200,
//       "Lesson fetched successfully.",
//       lesson,
//     );
//   });

// /**
//  * POST /api/lessons
//  *
//  * শুধু admin lesson schedule করতে পারবে।
//  *
//  * Important:
//  * Admin lesson create করলে একই সঙ্গে
//  * একটি confirmed Booking তৈরি হবে।
//  */
// export const createLesson =
//   asyncHandler(async (req, res) => {
//     const {
//       student,
//       teacher,
//       lessonDate,
//       startTime,
//       endTime,
//       vehicleType,
//       location = {},
//     } = req.body;

//     if (
//       !student ||
//       !teacher ||
//       !lessonDate ||
//       !startTime ||
//       !endTime ||
//       !vehicleType
//     ) {
//       throw new ApiError(
//         400,
//         "Student, teacher, date, start time, end time and vehicle type are required.",
//       );
//     }

//     if (
//       !VEHICLE_TYPES.includes(
//         vehicleType,
//       )
//     ) {
//       throw new ApiError(
//         400,
//         "Vehicle type must be manual or automatic.",
//       );
//     }

//     const [
//       selectedStudent,
//       selectedTeacher,
//     ] = await Promise.all([
//       findActiveUser(
//         student,
//         "student",
//         "Selected student",
//       ),

//       findActiveUser(
//         teacher,
//         "teacher",
//         "Selected teacher",
//       ),
//     ]);

//     const {
//       date,
//     } = getDayRange(
//       lessonDate,
//     );

//     const duration =
//       calculateDuration(
//         startTime,
//         endTime,
//       );

//     await ensureNoScheduleConflict({
//       student:
//         selectedStudent._id,

//       teacher:
//         selectedTeacher._id,

//       lessonDate: date,
//       startTime,
//       endTime,
//     });

//     const booking =
//       await Booking.create({
//         student:
//           selectedStudent._id,

//         teacher:
//           selectedTeacher._id,

//         location: {
//           address: String(
//             location?.address ||
//             "",
//           ).trim(),

//           city: String(
//             location?.city ||
//             "",
//           ).trim(),
//         },

//         vehicleType,

//         bookingDate: date,

//         startTime,

//         endTime,

//         duration,

//         status: "confirmed",
//       });

//     let lesson;

//     try {
//       lesson =
//         await Lesson.create({
//           booking:
//             booking._id,

//           student:
//             selectedStudent._id,

//           teacher:
//             selectedTeacher._id,

//           lessonDate: date,

//           startTime,

//           endTime,

//           duration,

//           status: "scheduled",
//         });
//     } catch (error) {
//       /**
//        * Lesson create fail করলে
//        * orphan booking delete হবে।
//        */
//       await Booking.findByIdAndDelete(
//         booking._id,
//       );

//       throw error;
//     }

//     await createNotificationsSafely([
//       {
//         user:
//           selectedStudent._id,

//         title:
//           "Lesson scheduled",

//         message:
//           `Your lesson is scheduled for ${startTime}.`,

//         type: "lesson",

//         actionUrl:
//           `/student/lessons/${lesson._id}`,
//       },

//       {
//         user:
//           selectedTeacher._id,

//         title:
//           "New lesson assigned",

//         message:
//           `A lesson has been assigned for ${startTime}.`,

//         type: "lesson",

//         actionUrl:
//           `/teacher/lessons/${lesson._id}`,
//       },
//     ]);

//     const createdLesson =
//       await populateLesson(
//         Lesson.findById(
//           lesson._id,
//         ),
//       );

//     return sendResponse(
//       res,
//       201,
//       "Lesson scheduled successfully.",
//       createdLesson,
//     );
//   });

// /**
//  * PATCH /api/lessons/:id
//  *
//  * শুধু admin lesson schedule update করতে পারবে।
//  */
// export const updateLesson =
//   asyncHandler(async (req, res) => {
//     const lesson =
//       await Lesson.findById(
//         req.params.id,
//       );

//     if (!lesson) {
//       throw new ApiError(
//         404,
//         "Lesson not found.",
//       );
//     }

//     if (
//       [
//         "completed",
//         "cancelled",
//       ].includes(
//         lesson.status,
//       )
//     ) {
//       throw new ApiError(
//         400,
//         "Completed or cancelled lesson cannot be edited.",
//       );
//     }

//     const booking =
//       await Booking.findById(
//         lesson.booking,
//       );

//     const teacherId =
//       req.body.teacher ||
//       lesson.teacher;

//     const lessonDate =
//       req.body.lessonDate ||
//       lesson.lessonDate;

//     const startTime =
//       req.body.startTime ||
//       lesson.startTime;

//     const endTime =
//       req.body.endTime ||
//       lesson.endTime;

//     const vehicleType =
//       req.body.vehicleType ||
//       booking?.vehicleType;

//     if (
//       !VEHICLE_TYPES.includes(
//         vehicleType,
//       )
//     ) {
//       throw new ApiError(
//         400,
//         "Vehicle type must be manual or automatic.",
//       );
//     }

//     const selectedTeacher =
//       await findActiveUser(
//         teacherId,
//         "teacher",
//         "Selected teacher",
//       );

//     const {
//       date,
//     } = getDayRange(
//       lessonDate,
//     );

//     const duration =
//       calculateDuration(
//         startTime,
//         endTime,
//       );

//     await ensureNoScheduleConflict({
//       student:
//         lesson.student,

//       teacher:
//         selectedTeacher._id,

//       lessonDate: date,

//       startTime,

//       endTime,

//       excludeLessonId:
//         lesson._id,
//     });

//     lesson.teacher =
//       selectedTeacher._id;

//     lesson.lessonDate =
//       date;

//     lesson.startTime =
//       startTime;

//     lesson.endTime =
//       endTime;

//     lesson.duration =
//       duration;

//     await lesson.save();

//     const bookingUpdate = {
//       vehicleType,
//     };

//     if (
//       req.body.location
//     ) {
//       bookingUpdate.location = {
//         address: String(
//           req.body.location
//             .address ||
//           "",
//         ).trim(),

//         city: String(
//           req.body.location
//             .city ||
//           "",
//         ).trim(),
//       };
//     }

//     await syncBookingFromLesson(
//       lesson,
//       bookingUpdate,
//     );

//     await createNotificationsSafely([
//       {
//         user:
//           lesson.student,

//         title:
//           "Lesson updated",

//         message:
//           "Your lesson schedule has been updated by an admin.",

//         type: "lesson",

//         actionUrl:
//           `/student/lessons/${lesson._id}`,
//       },

//       {
//         user:
//           lesson.teacher,

//         title:
//           "Lesson updated",

//         message:
//           "A lesson schedule assigned to you has been updated.",

//         type: "lesson",

//         actionUrl:
//           `/teacher/lessons/${lesson._id}`,
//       },
//     ]);

//     const updatedLesson =
//       await populateLesson(
//         Lesson.findById(
//           lesson._id,
//         ),
//       );

//     return sendResponse(
//       res,
//       200,
//       "Lesson updated successfully.",
//       updatedLesson,
//     );
//   });

// /**
//  * PATCH /api/lessons/:id/start
//  */
// export const startLesson =
//   asyncHandler(async (req, res) => {
//     const lesson =
//       await Lesson.findById(
//         req.params.id,
//       );

//     if (!lesson) {
//       throw new ApiError(
//         404,
//         "Lesson not found.",
//       );
//     }

//     const isAssignedTeacher =
//       getId(
//         lesson.teacher,
//       ) ===
//       getId(
//         req.user,
//       );

//     if (
//       req.user.role !== "admin" &&
//       !isAssignedTeacher
//     ) {
//       throw new ApiError(
//         403,
//         "You are not allowed to start this lesson.",
//       );
//     }

//     if (
//       lesson.status !==
//       "scheduled"
//     ) {
//       throw new ApiError(
//         400,
//         "Only a scheduled lesson can be started.",
//       );
//     }

//     lesson.status =
//       "in_progress";

//     await lesson.save();

//     await createNotificationsSafely([
//       {
//         user:
//           lesson.student,

//         title:
//           "Confirm lesson attendance",

//         message:
//           "Please confirm your attendance for the lesson.",

//         type:
//           "attendance",

//         actionUrl:
//           `/student/lessons/${lesson._id}`,

//         scheduledAt:
//           new Date(),
//       },

//       {
//         user:
//           lesson.teacher,

//         title:
//           "Confirm lesson attendance",

//         message:
//           "Please confirm your attendance for the lesson.",

//         type:
//           "attendance",

//         actionUrl:
//           `/teacher/lessons/${lesson._id}`,

//         scheduledAt:
//           new Date(),
//       },
//     ]);

//     const updatedLesson =
//       await populateLesson(
//         Lesson.findById(
//           lesson._id,
//         ),
//       );

//     return sendResponse(
//       res,
//       200,
//       "Lesson started successfully.",
//       updatedLesson,
//     );
//   });

// /**
//  * PATCH /api/lessons/:id/attendance
//  */
// export const confirmAttendance =
//   asyncHandler(async (req, res) => {
//     const lesson =
//       await Lesson.findById(
//         req.params.id,
//       );

//     if (!lesson) {
//       throw new ApiError(
//         404,
//         "Lesson not found.",
//       );
//     }

//     const isStudent =
//       getId(
//         lesson.student,
//       ) ===
//       getId(
//         req.user,
//       );

//     const isTeacher =
//       getId(
//         lesson.teacher,
//       ) ===
//       getId(
//         req.user,
//       );

//     const isAdmin =
//       req.user.role ===
//       "admin";

//     if (
//       !isStudent &&
//       !isTeacher &&
//       !isAdmin
//     ) {
//       throw new ApiError(
//         403,
//         "You are not allowed to confirm attendance for this lesson.",
//       );
//     }

//     if (
//       lesson.status !==
//       "in_progress"
//     ) {
//       throw new ApiError(
//         400,
//         "Attendance can only be confirmed for an in-progress lesson.",
//       );
//     }

//     if (
//       isStudent ||
//       (
//         isAdmin &&
//         req.body
//           .participant ===
//           "student"
//       )
//     ) {
//       lesson.attendance
//         .studentConfirmed =
//         true;

//       lesson.attendance
//         .studentConfirmedAt =
//         new Date();
//     }

//     if (
//       isTeacher ||
//       (
//         isAdmin &&
//         req.body
//           .participant ===
//           "teacher"
//       )
//     ) {
//       lesson.attendance
//         .teacherConfirmed =
//         true;

//       lesson.attendance
//         .teacherConfirmedAt =
//         new Date();
//     }

//     await lesson.save();

//     const updatedLesson =
//       await populateLesson(
//         Lesson.findById(
//           lesson._id,
//         ),
//       );

//     return sendResponse(
//       res,
//       200,
//       "Attendance confirmed successfully.",
//       updatedLesson,
//     );
//   });

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
// export const completeLesson =
//   asyncHandler(async (req, res) => {
//     const lesson =
//       await Lesson.findById(
//         req.params.id,
//       );

//     if (!lesson) {
//       throw new ApiError(
//         404,
//         "Lesson not found.",
//       );
//     }

//     const isAssignedTeacher =
//       getId(
//         lesson.teacher,
//       ) ===
//       getId(
//         req.user,
//       );

//     if (
//       req.user.role !== "admin" &&
//       !isAssignedTeacher
//     ) {
//       throw new ApiError(
//         403,
//         "You are not allowed to complete this lesson.",
//       );
//     }

//     if (
//       ![
//         "scheduled",
//         "in_progress",
//       ].includes(
//         lesson.status,
//       )
//     ) {
//       throw new ApiError(
//         400,
//         "This lesson cannot be completed.",
//       );
//     }

//     const lessonProgress =
//       req.body
//         .lessonProgress ||
//       {};

//     if (
//       Array.isArray(
//         lessonProgress
//           .skillsCovered,
//       )
//     ) {
//       lesson.lessonProgress
//         .skillsCovered =
//         lessonProgress
//           .skillsCovered
//           .map((skill) =>
//             String(
//               skill,
//             ).trim(),
//           )
//           .filter(Boolean);
//     }

//     if (
//       lessonProgress
//         .teacherNotes !==
//       undefined
//     ) {
//       lesson.lessonProgress
//         .teacherNotes =
//         String(
//           lessonProgress
//             .teacherNotes,
//         ).trim();
//     }

//     lesson.status =
//       "completed";

//     await lesson.save();

//     await syncBookingFromLesson(
//       lesson,
//       {
//         status:
//           "completed",
//       },
//     );

//     await createNotificationsSafely({
//       user:
//         lesson.student,

//       title:
//         "Lesson completed",

//       message:
//         "Your lesson has been marked as completed.",

//       type:
//         "lesson",

//       actionUrl:
//         `/student/lessons/${lesson._id}`,
//     });

//     const updatedLesson =
//       await populateLesson(
//         Lesson.findById(
//           lesson._id,
//         ),
//       );

//     return sendResponse(
//       res,
//       200,
//       "Lesson completed successfully.",
//       updatedLesson,
//     );
//   });

// /**
//  * PATCH /api/lessons/:id/cancel
//  *
//  * শুধু admin cancel করবে।
//  */
// export const cancelLesson =
//   asyncHandler(async (req, res) => {
//     const lesson =
//       await Lesson.findById(
//         req.params.id,
//       );

//     if (!lesson) {
//       throw new ApiError(
//         404,
//         "Lesson not found.",
//       );
//     }

//     if (
//       lesson.status ===
//       "completed"
//     ) {
//       throw new ApiError(
//         400,
//         "Completed lesson cannot be cancelled.",
//       );
//     }

//     if (
//       lesson.status ===
//       "cancelled"
//     ) {
//       throw new ApiError(
//         400,
//         "Lesson is already cancelled.",
//       );
//     }

//     const reason =
//       String(
//         req.body.reason ||
//         "",
//       ).trim();

//     if (!reason) {
//       throw new ApiError(
//         400,
//         "Cancellation reason is required.",
//       );
//     }

//     lesson.status =
//       "cancelled";

//     await lesson.save();

//     await syncBookingFromLesson(
//       lesson,
//       {
//         status:
//           "cancelled",

//         cancellation: {
//           cancelledBy:
//             req.user._id,

//           reason,

//           cancelledAt:
//             new Date(),
//         },
//       },
//     );

//     await createNotificationsSafely([
//       {
//         user:
//           lesson.student,

//         title:
//           "Lesson cancelled",

//         message:
//           `Your lesson was cancelled. Reason: ${reason}`,

//         type:
//           "lesson",

//         actionUrl:
//           "/student/lessons",
//       },

//       {
//         user:
//           lesson.teacher,

//         title:
//           "Lesson cancelled",

//         message:
//           `A lesson was cancelled. Reason: ${reason}`,

//         type:
//           "lesson",

//         actionUrl:
//           "/teacher/lessons",
//       },
//     ]);

//     const updatedLesson =
//       await populateLesson(
//         Lesson.findById(
//           lesson._id,
//         ),
//       );

//     return sendResponse(
//       res,
//       200,
//       "Lesson cancelled successfully.",
//       updatedLesson,
//     );
//   });

import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const LESSON_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"];

const ACTIVE_LESSON_STATUSES = ["scheduled", "in_progress"];

const VEHICLE_TYPES = ["manual", "automatic"];

const getId = (value) => {
  return String(value?._id || value || "");
};

const getDayRange = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Invalid lesson date.");
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    date,
    start,
    end,
  };
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

const populateLesson = (query) => {
  return query
    .populate("student", "name email phone avatar status")
    .populate("teacher", "name email phone avatar status")
    .populate({
      path: "booking",
      populate: {
        path: "offer",
        select: "title salePrice category",
      },
    });
};

const canAccessLesson = (user, lesson) => {
  if (user.role === "admin") {
    return true;
  }

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

/**
 * একই teacher অথবা student-এর একই সময়ে
 * আরেকটি active lesson আছে কি না check করবে।
 */
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
    status: {
      $in: ACTIVE_LESSON_STATUSES,
    },

    lessonDate: {
      $gte: start,
      $lte: end,
    },

    /**
     * Existing lesson:
     * 09:00 - 10:00
     *
     * New lesson:
     * 09:30 - 10:30
     *
     * এটি conflict হিসেবে ধরা হবে।
     */
    startTime: {
      $lt: endTime,
    },

    endTime: {
      $gt: startTime,
    },

    $or: [
      {
        student,
      },
      {
        teacher,
      },
    ],
  };

  if (excludeLessonId) {
    filter._id = {
      $ne: excludeLessonId,
    };
  }

  const conflict = await Lesson.findOne(filter).select(
    "student teacher lessonDate startTime endTime",
  );

  if (!conflict) {
    return;
  }

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

/**
 * Notification fail হলেও মূল lesson action fail করবে না।
 */
const createNotificationsSafely = async (notifications) => {
  try {
    await Notification.create(notifications);
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

/**
 * Lesson update হলে linked booking-ও update করবে।
 */
const syncBookingFromLesson = async (lesson, extra = {}) => {
  const bookingId = getId(lesson.booking);

  if (!bookingId) {
    return;
  }

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
    {
      runValidators: true,
    },
  );
};

/**
 * GET /api/lessons
 *
 * Admin: সব lesson
 * Student: নিজের lesson
 * Teacher: assigned lesson
 */
export const getLessons = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "student") {
    filter.student = req.user._id;
  }

  if (req.user.role === "teacher") {
    filter.teacher = req.user._id;
  }

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

  if (req.query.dateFrom || req.query.dateTo) {
    filter.lessonDate = {};

    if (req.query.dateFrom) {
      filter.lessonDate.$gte = getDayRange(req.query.dateFrom).start;
    }

    if (req.query.dateTo) {
      filter.lessonDate.$lte = getDayRange(req.query.dateTo).end;
    }
  }

  const lessons = await populateLesson(
    Lesson.find(filter).sort({
      lessonDate: -1,
      startTime: -1,
    }),
  );

  return sendResponse(res, 200, "Lessons fetched successfully.", lessons);
});

/**
 * GET /api/lessons/:id
 */
export const getLesson = asyncHandler(async (req, res) => {
  const lesson = await populateLesson(Lesson.findById(req.params.id));

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  if (!canAccessLesson(req.user, lesson)) {
    throw new ApiError(403, "You are not allowed to access this lesson.");
  }

  return sendResponse(res, 200, "Lesson fetched successfully.", lesson);
});

/**
 * POST /api/lessons
 *
 * শুধু admin lesson schedule করতে পারবে।
 *
 * Important:
 * Admin lesson create করলে একই সঙ্গে
 * একটি confirmed Booking তৈরি হবে।
 */
export const createLesson = asyncHandler(async (req, res) => {
  const {
    student,
    teacher,
    lessonDate,
    startTime,
    endTime,
    vehicleType,
    location = {},
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

  const [selectedStudent, selectedTeacher] = await Promise.all([
    findActiveUser(student, "student", "Selected student"),

    findActiveUser(teacher, "teacher", "Selected teacher"),
  ]);

  const { date } = getDayRange(lessonDate);

  const duration = calculateDuration(startTime, endTime);

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
    },

    vehicleType,

    bookingDate: date,

    startTime,

    endTime,

    duration,

    status: "confirmed",
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
    });
  } catch (error) {
    /**
     * Lesson create fail করলে
     * orphan booking delete হবে।
     */
    await Booking.findByIdAndDelete(booking._id);

    throw error;
  }

  await createNotificationsSafely([
    {
      user: selectedStudent._id,

      title: "Lesson scheduled",

      message: `Your lesson is scheduled for ${startTime}.`,

      type: "lesson",

      actionUrl: `/student/lessons/${lesson._id}`,
    },

    {
      user: selectedTeacher._id,

      title: "New lesson assigned",

      message: `A lesson has been assigned for ${startTime}.`,

      type: "lesson",

      actionUrl: `/teacher/lessons/${lesson._id}`,
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

/**
 * PATCH /api/lessons/:id
 *
 * শুধু admin lesson schedule update করতে পারবে।
 */
export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  if (["completed", "cancelled"].includes(lesson.status)) {
    throw new ApiError(400, "Completed or cancelled lesson cannot be edited.");
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

  await lesson.save();

  const bookingUpdate = {
    vehicleType,
  };

  if (req.body.location) {
    bookingUpdate.location = {
      address: String(req.body.location.address || "").trim(),

      city: String(req.body.location.city || "").trim(),
    };
  }

  await syncBookingFromLesson(lesson, bookingUpdate);

  await createNotificationsSafely([
    {
      user: lesson.student,

      title: "Lesson updated",

      message: "Your lesson schedule has been updated by an admin.",

      type: "lesson",

      actionUrl: `/student/lessons/${lesson._id}`,
    },

    {
      user: lesson.teacher,

      title: "Lesson updated",

      message: "A lesson schedule assigned to you has been updated.",

      type: "lesson",

      actionUrl: `/teacher/lessons/${lesson._id}`,
    },
  ]);

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));

  return sendResponse(res, 200, "Lesson updated successfully.", updatedLesson);
});

/**
 * PATCH /api/lessons/:id/start
 */
export const startLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  const isAssignedTeacher = getId(lesson.teacher) === getId(req.user);

  if (req.user.role !== "admin" && !isAssignedTeacher) {
    throw new ApiError(403, "You are not allowed to start this lesson.");
  }

  if (lesson.status !== "scheduled") {
    throw new ApiError(400, "Only a scheduled lesson can be started.");
  }

  lesson.status = "in_progress";

  await lesson.save();

  await createNotificationsSafely([
    {
      user: lesson.student,

      title: "Confirm lesson attendance",

      message: "Please confirm your attendance for the lesson.",

      type: "attendance",

      actionUrl: `/student/lessons/${lesson._id}`,

      scheduledAt: new Date(),
    },

    {
      user: lesson.teacher,

      title: "Confirm lesson attendance",

      message: "Please confirm your attendance for the lesson.",

      type: "attendance",

      actionUrl: `/teacher/lessons/${lesson._id}`,

      scheduledAt: new Date(),
    },
  ]);

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));

  return sendResponse(res, 200, "Lesson started successfully.", updatedLesson);
});

/**
 * PATCH /api/lessons/:id/attendance
 */
export const confirmAttendance = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  const isStudent = getId(lesson.student) === getId(req.user);

  const isTeacher = getId(lesson.teacher) === getId(req.user);

  const isAdmin = req.user.role === "admin";

  if (!isStudent && !isTeacher && !isAdmin) {
    throw new ApiError(
      403,
      "You are not allowed to confirm attendance for this lesson.",
    );
  }

  if (lesson.status !== "in_progress") {
    throw new ApiError(
      400,
      "Attendance can only be confirmed for an in-progress lesson.",
    );
  }

  if (isStudent || (isAdmin && req.body.participant === "student")) {
    lesson.attendance.studentConfirmed = true;

    lesson.attendance.studentConfirmedAt = new Date();
  }

  if (isTeacher || (isAdmin && req.body.participant === "teacher")) {
    lesson.attendance.teacherConfirmed = true;

    lesson.attendance.teacherConfirmedAt = new Date();
  }

  await lesson.save();

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));

  return sendResponse(
    res,
    200,
    "Attendance confirmed successfully.",
    updatedLesson,
  );
});

/**
 * PATCH /api/lessons/:id/complete
 *
 * Body example:
 *
 * {
 *   "lessonProgress": {
 *     "skillsCovered": [
 *       "Parking",
 *       "Lane Changing"
 *     ],
 *     "teacherNotes": "Good progress"
 *   }
 * }
 */
export const completeLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  const isAssignedTeacher = getId(lesson.teacher) === getId(req.user);

  if (req.user.role !== "admin" && !isAssignedTeacher) {
    throw new ApiError(403, "You are not allowed to complete this lesson.");
  }

  if (!["scheduled", "in_progress"].includes(lesson.status)) {
    throw new ApiError(400, "This lesson cannot be completed.");
  }

  const lessonProgress = req.body.lessonProgress || {};

  if (Array.isArray(lessonProgress.skillsCovered)) {
    lesson.lessonProgress.skillsCovered = lessonProgress.skillsCovered
      .map((skill) => String(skill).trim())
      .filter(Boolean);
  }

  if (lessonProgress.teacherNotes !== undefined) {
    lesson.lessonProgress.teacherNotes = String(
      lessonProgress.teacherNotes,
    ).trim();
  }

  lesson.status = "completed";

  await lesson.save();

  await syncBookingFromLesson(lesson, {
    status: "completed",
  });

  await createNotificationsSafely({
    user: lesson.student,

    title: "Lesson completed",

    message: "Your lesson has been marked as completed.",

    type: "lesson",

    actionUrl: `/student/lessons/${lesson._id}`,
  });

  const updatedLesson = await populateLesson(Lesson.findById(lesson._id));

  return sendResponse(
    res,
    200,
    "Lesson completed successfully.",
    updatedLesson,
  );
});

/**
 * PATCH /api/lessons/:id/cancel
 *
 * শুধু admin cancel করবে।
 */
export const cancelLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    throw new ApiError(404, "Lesson not found.");
  }

  if (lesson.status === "completed") {
    throw new ApiError(400, "Completed lesson cannot be cancelled.");
  }

  if (lesson.status === "cancelled") {
    throw new ApiError(400, "Lesson is already cancelled.");
  }

  const reason = String(req.body.reason || "").trim();

  if (!reason) {
    throw new ApiError(400, "Cancellation reason is required.");
  }

  lesson.status = "cancelled";

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
