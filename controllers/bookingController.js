// import mongoose from "mongoose";

// import Booking from "../models/Booking.js";
// import Lesson from "../models/Lesson.js";
// import Notification from "../models/Notification.js";
// import TeacherAvailability from "../models/TeacherAvailability.js";
// import TeacherLocation from "../models/TeacherLocation.js";
// import TeacherProfile from "../models/TeacherProfile.js";
// import TeacherVehicle from "../models/TeacherVehicle.js";
// import ApiError from "../utils/ApiError.js";
// import sendResponse from "../utils/ApiResponse.js";
// import asyncHandler from "../utils/asyncHandler.js";
// import {
//   ACTIVE_BOOKING_STATUSES,
//   buildAvailableSlots,
//   getId,
//   getUtcDayRange,
//   haversineDistanceKm,
//   isTimeInsideWorkingSlots,
//   normalizeTime,
//   timeToMinutes,
// } from "../utils/bookingAvailability.js";

// const VEHICLE_TYPES = ["manual", "automatic", "electric"];
// const BOOKING_STATUSES = [
//   "pending",
//   "confirmed",
//   "rejected",
//   "cancelled",
//   "completed",
//   "expired",
// ];

// const responseWindowMinutes = () => {
//   const value = Number(process.env.BOOKING_RESPONSE_MINUTES || 360);
//   return Number.isFinite(value) && value >= 15 ? value : 360;
// };

// const populateBooking = (query) =>
//   query
//     .populate("student", "name fullName email phone avatar")
//     .populate("teacher", "name fullName email phone avatar")
//     .populate("offer", "title salePrice category")
//     .populate(
//       "teacherLocation",
//       "title address city postalCode placeId coordinates serviceRadiusKm meetingType status",
//     )
//     .populate(
//       "teacherVehicle",
//       "vehicleName vehicleType brand model modelYear registrationNumber vehicleImage approvalStatus status",
//     )
//     .populate(
//       "lesson",
//       "lessonDate startTime endTime duration status attendance lessonProgress",
//     );

// const createNotificationsSafely = async (items) => {
//   if (!Array.isArray(items) || !items.length) return;

//   try {
//     await Notification.create(items);
//   } catch (error) {
//     console.error("Notification creation failed:", error.message);
//   }
// };

// const canAccessBooking = (user, booking) => {
//   if (user.role === "admin") return true;
//   if (user.role === "student") return getId(booking.student) === getId(user);
//   if (user.role === "teacher") return getId(booking.teacher) === getId(user);
//   return false;
// };

// const locationPoint = (location) => {
//   const lat = Number(
//     location?.coordinates?.lat ?? location?.geoLocation?.coordinates?.[1],
//   );
//   const lng = Number(
//     location?.coordinates?.lng ?? location?.geoLocation?.coordinates?.[0],
//   );

//   return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
// };

// const makeTeacherLocationSnapshot = (location, meetingType) => {
//   const point = locationPoint(location);

//   return {
//     address: location.address || "",
//     city: location.city || "",
//     postalCode: location.postalCode || "",
//     placeId: location.placeId || "",
//     lat: point?.lat,
//     lng: point?.lng,
//     meetingType,
//   };
// };

// const makeStudentLocationSnapshot = (studentLocation, meetingType) => ({
//   address: String(studentLocation?.address || "").trim(),
//   city: String(studentLocation?.city || "").trim(),
//   postalCode: String(studentLocation?.postalCode || "").trim(),
//   placeId: String(studentLocation?.placeId || "").trim(),
//   lat: Number(studentLocation?.lat),
//   lng: Number(studentLocation?.lng),
//   meetingType,
// });

// const makeVehicleSnapshot = (vehicle) => ({
//   vehicleName: vehicle.vehicleName || "",
//   vehicleType: vehicle.vehicleType,
//   brand: vehicle.brand || "",
//   model: vehicle.model || "",
//   modelYear: vehicle.modelYear,
//   registrationNumber: vehicle.registrationNumber || "",
//   vehicleImage: vehicle.vehicleImage || "",
// });

// const expirePendingBookings = async (extraFilter = {}) => {
//   await Booking.updateMany(
//     {
//       ...extraFilter,
//       status: "pending",
//       expiresAt: { $ne: null, $lte: new Date() },
//     },
//     { $set: { status: "expired" } },
//   );
// };

// const getOccupiedSlots = async (teacher, date) => {
//   const { start, end } = getUtcDayRange(date);

//   await expirePendingBookings({
//     teacher,
//     bookingDate: { $gte: start, $lte: end },
//   });

//   return Booking.find({
//     teacher,
//     bookingDate: { $gte: start, $lte: end },
//     status: { $in: ACTIVE_BOOKING_STATUSES },
//   })
//     .select("startTime endTime status")
//     .sort({ startTime: 1 })
//     .lean();
// };

// const ensureNoConflict = async ({
//   student,
//   teacher,
//   bookingDate,
//   startTime,
//   endTime,
//   excludeBookingId,
//   session,
// }) => {
//   const { start, end } = getUtcDayRange(bookingDate);
//   const filter = {
//     status: { $in: ACTIVE_BOOKING_STATUSES },
//     bookingDate: { $gte: start, $lte: end },
//     startTime: { $lt: endTime },
//     endTime: { $gt: startTime },
//     $or: [{ student }, { teacher }],
//   };

//   if (excludeBookingId) filter._id = { $ne: excludeBookingId };

//   const query = Booking.findOne(filter).select(
//     "student teacher startTime endTime",
//   );
//   if (session) query.session(session);

//   const conflict = await query;
//   if (!conflict) return;

//   if (getId(conflict.teacher) === getId(teacher)) {
//     throw new ApiError(
//       409,
//       `Teacher is already booked from ${conflict.startTime} to ${conflict.endTime}.`,
//     );
//   }

//   throw new ApiError(
//     409,
//     `You already have a booking from ${conflict.startTime} to ${conflict.endTime}.`,
//   );
// };

// const resolveMeetingType = ({ teacherLocation, meetingPreference }) => {
//   if (teacherLocation.meetingType === "student_pickup") {
//     return "student_pickup";
//   }

//   if (teacherLocation.meetingType === "both") {
//     // A map booking already contains the student-selected point, so pickup is
//     // the natural default. The frontend may explicitly request the teacher
//     // meeting point by sending meetingPreference: "teacher_location".
//     return meetingPreference === "teacher_location"
//       ? "teacher_location"
//       : "student_pickup";
//   }

//   return "teacher_location";
// };

// const getExpiryDate = () =>
//   new Date(Date.now() + responseWindowMinutes() * 60 * 1000);

// export const getTeacherAvailability = asyncHandler(async (req, res) => {
//   const { teacher, date } = req.query;

//   if (!teacher || !date) {
//     throw new ApiError(400, "Teacher and date are required.");
//   }

//   const [occupiedSlots, availability] = await Promise.all([
//     getOccupiedSlots(teacher, date),
//     TeacherAvailability.findOne({ teacher }).lean(),
//   ]);

//   sendResponse(res, 200, "Teacher availability fetched successfully.", {
//     teacher,
//     date,
//     occupiedSlots,
//     availability,
//   });
// });

// export const getAvailableSlots = asyncHandler(async (req, res) => {
//   const { teacher, date, duration = 60 } = req.query;

//   if (!teacher || !date) {
//     throw new ApiError(400, "Teacher and date are required.");
//   }

//   const [occupiedSlots, availability] = await Promise.all([
//     getOccupiedSlots(teacher, date),
//     TeacherAvailability.findOne({ teacher }).lean(),
//   ]);

//   const availableSlots = buildAvailableSlots({
//     availability,
//     bookingDate: date,
//     duration: Number(duration),
//     occupiedSlots,
//   });

//   sendResponse(res, 200, "Available slots fetched successfully.", {
//     teacher,
//     date,
//     duration: Number(duration),
//     availableSlots,
//     occupiedSlots,
//   });
// });

// export const createBooking = asyncHandler(async (req, res) => {
//   const {
//     teacher,
//     offer,
//     locationId,
//     vehicleType,
//     bookingDate,
//     startTime: rawStartTime,
//     endTime: rawEndTime,
//     studentLocation,
//     meetingPreference,
//   } = req.body;

//   if (
//     !teacher ||
//     !locationId ||
//     !vehicleType ||
//     !bookingDate ||
//     !rawStartTime ||
//     !rawEndTime
//   ) {
//     throw new ApiError(
//       400,
//       "Teacher, location, vehicle, date and time are required.",
//     );
//   }

//   if (!VEHICLE_TYPES.includes(String(vehicleType).toLowerCase())) {
//     throw new ApiError(
//       400,
//       "Vehicle type must be manual, automatic or electric.",
//     );
//   }

//   const normalizedVehicleType = String(vehicleType).toLowerCase();

//   const [profile, vehicle, teacherLocation, availability] = await Promise.all([
//     TeacherProfile.findOne({
//       user: teacher,
//       verificationStatus: "verified",
//       availabilityStatus: "available",
//     }).populate("user", "status role"),
//     TeacherVehicle.findOne({
//       teacher,
//       vehicleType: normalizedVehicleType,
//       approvalStatus: "approved",
//       status: "active",
//     }),
//     TeacherLocation.findOne({
//       _id: locationId,
//       teacher,
//       status: "active",
//     }),
//     TeacherAvailability.findOne({ teacher }).lean(),
//   ]);

//   if (
//     !profile?.user ||
//     profile.user.status !== "active" ||
//     profile.user.role !== "teacher"
//   ) {
//     throw new ApiError(400, "Selected teacher is not available.");
//   }

//   if (!vehicle) {
//     throw new ApiError(
//       400,
//       `Teacher has no approved active ${normalizedVehicleType} vehicle.`,
//     );
//   }

//   if (!teacherLocation) {
//     throw new ApiError(400, "Selected lesson location is unavailable.");
//   }

//   const { date } = getUtcDayRange(bookingDate);
//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0);

//   if (date < today) {
//     throw new ApiError(400, "A booking cannot be created for a past date.");
//   }

//   const startTime = normalizeTime(rawStartTime, "Start time");
//   const endTime = normalizeTime(rawEndTime, "End time");
//   const duration = timeToMinutes(endTime) - timeToMinutes(startTime);

//   if (duration < 30 || duration > 240) {
//     throw new ApiError(
//       400,
//       "Lesson duration must be between 30 and 240 minutes.",
//     );
//   }

//   if (
//     !isTimeInsideWorkingSlots({
//       availability,
//       bookingDate: date,
//       startTime,
//       endTime,
//     })
//   ) {
//     throw new ApiError(409, "Teacher is not working during the selected time.");
//   }

//   await expirePendingBookings({ student: req.user._id });
//   await expirePendingBookings({ teacher });

//   await ensureNoConflict({
//     student: req.user._id,
//     teacher,
//     bookingDate: date,
//     startTime,
//     endTime,
//   });

//   const teacherPoint = locationPoint(teacherLocation);
//   const studentLat = Number(studentLocation?.lat);
//   const studentLng = Number(studentLocation?.lng);
//   const hasStudentPoint =
//     Number.isFinite(studentLat) && Number.isFinite(studentLng);

//   const meetingType = resolveMeetingType({
//     teacherLocation,
//     meetingPreference,
//   });

//   if (meetingType === "student_pickup" && !hasStudentPoint) {
//     throw new ApiError(
//       400,
//       "A valid student pickup point is required for this teacher location.",
//     );
//   }

//   let distanceKm;
//   if (teacherPoint && hasStudentPoint) {
//     distanceKm = haversineDistanceKm(
//       studentLat,
//       studentLng,
//       teacherPoint.lat,
//       teacherPoint.lng,
//     );

//     if (distanceKm > Number(teacherLocation.serviceRadiusKm || 10)) {
//       throw new ApiError(
//         400,
//         "This pickup/search point is outside the teacher's service radius.",
//       );
//     }
//   }

//   const studentSnapshot = hasStudentPoint
//     ? makeStudentLocationSnapshot(studentLocation, "student_pickup")
//     : undefined;

//   const officialLocation =
//     meetingType === "student_pickup"
//       ? studentSnapshot
//       : makeTeacherLocationSnapshot(teacherLocation, "teacher_location");

//   const hourlyRate = Number(profile.hourlyRate) || 0;

//   const booking = await Booking.create({
//     student: req.user._id,
//     teacher,
//     offer: offer || undefined,
//     teacherLocation: teacherLocation._id,
//     teacherVehicle: vehicle._id,
//     location: officialLocation,
//     studentSearchLocation: studentSnapshot,
//     vehicleSnapshot: makeVehicleSnapshot(vehicle),
//     distanceKm: Number.isFinite(distanceKm)
//       ? Number(distanceKm.toFixed(2))
//       : undefined,
//     vehicleType: normalizedVehicleType,
//     bookingDate: date,
//     startTime,
//     endTime,
//     duration,
//     pricingSnapshot: {
//       hourlyRate,
//       subtotal: Number(((hourlyRate * duration) / 60).toFixed(2)),
//       currency: process.env.DEFAULT_CURRENCY || "EUR",
//     },
//     status: "pending",
//     expiresAt: getExpiryDate(),
//   });

//   await createNotificationsSafely([
//     {
//       user: teacher,
//       title: "New lesson booking request",
//       message: "A student requested a driving lesson.",
//       type: "booking",
//       actionUrl: `/teacher/lessons?tab=requests&bookingId=${booking._id}`,
//     },
//     {
//       user: req.user._id,
//       title: "Booking request created",
//       message: "Your request is waiting for teacher confirmation.",
//       type: "booking",
//       actionUrl: `/student/lessons?tab=requests&bookingId=${booking._id}`,
//     },
//   ]);

//   const populated = await populateBooking(Booking.findById(booking._id));
//   sendResponse(res, 201, "Booking request created successfully.", populated);
// });

// export const getBookings = asyncHandler(async (req, res) => {
//   const filter = {};

//   if (req.user.role === "student") filter.student = req.user._id;
//   if (req.user.role === "teacher") filter.teacher = req.user._id;

//   if (req.query.status && req.query.status !== "all") {
//     if (!BOOKING_STATUSES.includes(req.query.status)) {
//       throw new ApiError(400, "Invalid booking status.");
//     }
//     filter.status = req.query.status;
//   }

//   await expirePendingBookings(filter);

//   const bookings = await populateBooking(
//     Booking.find(filter).sort({ bookingDate: -1, startTime: -1 }),
//   );

//   sendResponse(res, 200, "Bookings fetched successfully.", bookings);
// });

// export const getBooking = asyncHandler(async (req, res) => {
//   await expirePendingBookings({ _id: req.params.id });

//   const booking = await populateBooking(Booking.findById(req.params.id));

//   if (!booking) throw new ApiError(404, "Booking not found.");
//   if (!canAccessBooking(req.user, booking)) {
//     throw new ApiError(403, "Access denied.");
//   }

//   sendResponse(res, 200, "Booking fetched successfully.", booking);
// });

// export const confirmBooking = asyncHandler(async (req, res) => {
//   await expirePendingBookings({ _id: req.params.id });

//   const session = await mongoose.startSession();
//   let bookingId;
//   let lessonId;

//   try {
//     await session.withTransaction(async () => {
//       const booking = await Booking.findById(req.params.id).session(session);

//       if (!booking) throw new ApiError(404, "Booking not found.");

//       if (
//         req.user.role !== "admin" &&
//         getId(booking.teacher) !== getId(req.user)
//       ) {
//         throw new ApiError(
//           403,
//           "Only the assigned teacher can confirm this booking.",
//         );
//       }

//       if (booking.status === "confirmed") {
//         const existingLesson =
//           (booking.lesson &&
//             (await Lesson.findById(booking.lesson).session(session))) ||
//           (await Lesson.findOne({ booking: booking._id }).session(session));

//         if (existingLesson) {
//           if (!booking.lesson) {
//             booking.lesson = existingLesson._id;
//             await booking.save({ session });
//           }
//           bookingId = booking._id;
//           lessonId = existingLesson._id;
//           return;
//         }
//       }

//       if (booking.status !== "pending") {
//         throw new ApiError(400, "Only pending bookings can be confirmed.");
//       }

//       const availabilityQuery = TeacherAvailability.findOne({
//         teacher: booking.teacher,
//       })
//         .session(session)
//         .lean();

//       const locationQuery = booking.teacherLocation
//         ? TeacherLocation.findOne({
//             _id: booking.teacherLocation,
//             teacher: booking.teacher,
//             status: "active",
//           }).session(session)
//         : Promise.resolve(null);

//       // Existing pending bookings created before this upgrade did not save a
//       // teacherVehicle reference, so fall back to the approved active vehicle.
//       const vehicleQuery = TeacherVehicle.findOne({
//         ...(booking.teacherVehicle
//           ? { _id: booking.teacherVehicle }
//           : { vehicleType: booking.vehicleType }),
//         teacher: booking.teacher,
//         approvalStatus: "approved",
//         status: "active",
//       }).session(session);

//       const [availability, location, vehicle] = await Promise.all([
//         availabilityQuery,
//         locationQuery,
//         vehicleQuery,
//       ]);

//       if (booking.teacherLocation && !location) {
//         throw new ApiError(
//           409,
//           "The selected teacher location is no longer active.",
//         );
//       }

//       if (!vehicle) {
//         throw new ApiError(
//           409,
//           "The selected teacher vehicle is no longer available.",
//         );
//       }

//       if (!booking.teacherVehicle) booking.teacherVehicle = vehicle._id;
//       if (!booking.vehicleSnapshot) {
//         booking.vehicleSnapshot = makeVehicleSnapshot(vehicle);
//       }

//       if (
//         !isTimeInsideWorkingSlots({
//           availability,
//           bookingDate: booking.bookingDate,
//           startTime: booking.startTime,
//           endTime: booking.endTime,
//         })
//       ) {
//         throw new ApiError(
//           409,
//           "The teacher is no longer available during the selected time.",
//         );
//       }

//       await ensureNoConflict({
//         student: booking.student,
//         teacher: booking.teacher,
//         bookingDate: booking.bookingDate,
//         startTime: booking.startTime,
//         endTime: booking.endTime,
//         excludeBookingId: booking._id,
//         session,
//       });

//       let lesson = await Lesson.findOne({ booking: booking._id }).session(
//         session,
//       );

//       if (!lesson) {
//         [lesson] = await Lesson.create(
//           [
//             {
//               booking: booking._id,
//               student: booking.student,
//               teacher: booking.teacher,
//               lessonDate: booking.bookingDate,
//               startTime: booking.startTime,
//               endTime: booking.endTime,
//               duration: booking.duration,
//               status: "scheduled",
//               history: [
//                 {
//                   action: "created_from_booking",
//                   by: req.user._id,
//                   note: "Lesson created after booking confirmation.",
//                 },
//               ],
//             },
//           ],
//           { session },
//         );
//       }

//       booking.status = "confirmed";
//       booking.lesson = lesson._id;
//       booking.confirmation = {
//         confirmedBy: req.user._id,
//         confirmedAt: new Date(),
//       };
//       await booking.save({ session });

//       bookingId = booking._id;
//       lessonId = lesson._id;
//     });
//   } finally {
//     await session.endSession();
//   }

//   const [booking, lesson] = await Promise.all([
//     populateBooking(Booking.findById(bookingId)),
//     Lesson.findById(lessonId)
//       .populate("student", "name fullName email phone avatar")
//       .populate("teacher", "name fullName email phone avatar")
//       .populate("booking"),
//   ]);

//   await createNotificationsSafely([
//     {
//       user: booking.student?._id || booking.student,
//       title: "Booking confirmed",
//       message:
//         "Your teacher confirmed the booking and your lesson is scheduled.",
//       type: "booking",
//       actionUrl: `/student/lessons?tab=upcoming&lessonId=${lesson._id}`,
//     },
//   ]);

//   sendResponse(res, 200, "Booking confirmed and lesson created successfully.", {
//     booking,
//     lesson,
//   });
// });

// export const rejectBooking = asyncHandler(async (req, res) => {
//   await expirePendingBookings({ _id: req.params.id });

//   const booking = await Booking.findById(req.params.id);

//   if (!booking) throw new ApiError(404, "Booking not found.");

//   if (req.user.role !== "admin" && getId(booking.teacher) !== getId(req.user)) {
//     throw new ApiError(
//       403,
//       "Only the assigned teacher can reject this booking.",
//     );
//   }

//   if (booking.status !== "pending") {
//     throw new ApiError(400, "Only pending bookings can be rejected.");
//   }

//   const reason = String(req.body.reason || "Teacher is unavailable.").trim();

//   booking.status = "rejected";
//   booking.rejection = {
//     rejectedBy: req.user._id,
//     reason,
//     rejectedAt: new Date(),
//   };
//   await booking.save();

//   await createNotificationsSafely([
//     {
//       user: booking.student,
//       title: "Booking rejected",
//       message: `Your booking was rejected. Reason: ${reason}`,
//       type: "booking",
//       actionUrl: `/student/lessons?tab=requests&bookingId=${booking._id}`,
//     },
//   ]);

//   const populated = await populateBooking(Booking.findById(booking._id));
//   sendResponse(res, 200, "Booking rejected successfully.", populated);
// });

// export const cancelBooking = asyncHandler(async (req, res) => {
//   await expirePendingBookings({ _id: req.params.id });

//   const reason = String(req.body.reason || "").trim();
//   if (!reason) throw new ApiError(400, "Cancellation reason is required.");

//   const session = await mongoose.startSession();
//   let bookingId;
//   let notifyUser;
//   let actionUrl;

//   try {
//     await session.withTransaction(async () => {
//       const booking = await Booking.findById(req.params.id).session(session);

//       if (!booking) throw new ApiError(404, "Booking not found.");
//       if (!canAccessBooking(req.user, booking)) {
//         throw new ApiError(403, "Access denied.");
//       }

//       if (
//         ["cancelled", "rejected", "completed", "expired"].includes(
//           booking.status,
//         )
//       ) {
//         throw new ApiError(400, "This booking cannot be cancelled.");
//       }

//       if (req.user.role === "student" && booking.status !== "pending") {
//         throw new ApiError(
//           400,
//           "A confirmed lesson must be cancelled through the lesson cancellation request.",
//         );
//       }

//       booking.status = "cancelled";
//       booking.cancellation = {
//         cancelledBy: req.user._id,
//         reason,
//         cancelledAt: new Date(),
//       };
//       await booking.save({ session });

//       if (booking.lesson) {
//         await Lesson.findOneAndUpdate(
//           {
//             _id: booking.lesson,
//             status: { $in: ["scheduled", "in_progress"] },
//           },
//           {
//             $set: {
//               status: "cancelled",
//               cancellation: {
//                 cancelledBy: req.user._id,
//                 reason,
//                 cancelledAt: new Date(),
//               },
//             },
//             $push: {
//               history: {
//                 action: "cancelled_from_booking",
//                 by: req.user._id,
//                 note: reason,
//               },
//             },
//           },
//           { session },
//         );
//       }

//       bookingId = booking._id;
//       notifyUser =
//         req.user.role === "student" ? booking.teacher : booking.student;
//       actionUrl =
//         req.user.role === "student"
//           ? `/teacher/lessons?tab=requests&bookingId=${booking._id}`
//           : `/student/lessons?tab=requests&bookingId=${booking._id}`;
//     });
//   } finally {
//     await session.endSession();
//   }

//   await createNotificationsSafely([
//     {
//       user: notifyUser,
//       title: "Booking cancelled",
//       message: `A booking was cancelled. Reason: ${reason}`,
//       type: "booking",
//       actionUrl,
//     },
//   ]);

//   const populated = await populateBooking(Booking.findById(bookingId));
//   sendResponse(res, 200, "Booking cancelled successfully.", populated);
// });

import mongoose from "mongoose";

import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Notification from "../models/Notification.js";
import TeacherAvailability from "../models/TeacherAvailability.js";
import TeacherLocation from "../models/TeacherLocation.js";
import TeacherProfile from "../models/TeacherProfile.js";
import TeacherVehicle from "../models/TeacherVehicle.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  ACTIVE_BOOKING_STATUSES,
  buildAvailableSlots,
  getId,
  getUtcDayRange,
  haversineDistanceKm,
  isTimeInsideWorkingSlots,
  normalizeTime,
  timeToMinutes,
} from "../utils/bookingAvailability.js";

const VEHICLE_TYPES = ["manual", "automatic", "electric"];
const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
  "no_show",
  "expired",
];

const responseWindowMinutes = () => {
  const value = Number(process.env.BOOKING_RESPONSE_MINUTES || 360);
  return Number.isFinite(value) && value >= 15 ? value : 360;
};

const populateBooking = (query) =>
  query
    .populate("student", "name fullName email phone avatar")
    .populate("teacher", "name fullName email phone avatar")
    .populate("offer", "title salePrice category")
    .populate(
      "teacherLocation",
      "title address city postalCode placeId coordinates serviceRadiusKm meetingType status",
    )
    .populate(
      "teacherVehicle",
      "vehicleName vehicleType brand model modelYear registrationNumber vehicleImage approvalStatus status",
    )
    .populate(
      "lesson",
      "lessonDate startTime endTime duration status attendance lessonProgress",
    );

const createNotificationsSafely = async (items) => {
  if (!Array.isArray(items) || !items.length) return;

  try {
    await Notification.create(items);
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

const canAccessBooking = (user, booking) => {
  if (user.role === "admin") return true;
  if (user.role === "student") return getId(booking.student) === getId(user);
  if (user.role === "teacher") return getId(booking.teacher) === getId(user);
  return false;
};

const locationPoint = (location) => {
  const lat = Number(
    location?.coordinates?.lat ?? location?.geoLocation?.coordinates?.[1],
  );
  const lng = Number(
    location?.coordinates?.lng ?? location?.geoLocation?.coordinates?.[0],
  );

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const makeTeacherLocationSnapshot = (location, meetingType) => {
  const point = locationPoint(location);

  return {
    address: location.address || "",
    city: location.city || "",
    postalCode: location.postalCode || "",
    placeId: location.placeId || "",
    lat: point?.lat,
    lng: point?.lng,
    meetingType,
  };
};

const makeStudentLocationSnapshot = (studentLocation, meetingType) => ({
  address: String(studentLocation?.address || "").trim(),
  city: String(studentLocation?.city || "").trim(),
  postalCode: String(studentLocation?.postalCode || "").trim(),
  placeId: String(studentLocation?.placeId || "").trim(),
  lat: Number(studentLocation?.lat),
  lng: Number(studentLocation?.lng),
  meetingType,
});

const makeVehicleSnapshot = (vehicle) => ({
  vehicleName: vehicle.vehicleName || "",
  vehicleType: vehicle.vehicleType,
  brand: vehicle.brand || "",
  model: vehicle.model || "",
  modelYear: vehicle.modelYear,
  registrationNumber: vehicle.registrationNumber || "",
  vehicleImage: vehicle.vehicleImage || "",
});

const expirePendingBookings = async (extraFilter = {}) => {
  await Booking.updateMany(
    {
      ...extraFilter,
      status: "pending",
      expiresAt: { $ne: null, $lte: new Date() },
    },
    { $set: { status: "expired" } },
  );
};

const getOccupiedSlots = async (teacher, date) => {
  const { start, end } = getUtcDayRange(date);

  await expirePendingBookings({
    teacher,
    bookingDate: { $gte: start, $lte: end },
  });

  return Booking.find({
    teacher,
    bookingDate: { $gte: start, $lte: end },
    status: { $in: ACTIVE_BOOKING_STATUSES },
  })
    .select("startTime endTime status")
    .sort({ startTime: 1 })
    .lean();
};

const ensureNoConflict = async ({
  student,
  teacher,
  bookingDate,
  startTime,
  endTime,
  excludeBookingId,
  session,
}) => {
  const { start, end } = getUtcDayRange(bookingDate);
  const filter = {
    status: { $in: ACTIVE_BOOKING_STATUSES },
    bookingDate: { $gte: start, $lte: end },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    $or: [{ student }, { teacher }],
  };

  if (excludeBookingId) filter._id = { $ne: excludeBookingId };

  const query = Booking.findOne(filter).select(
    "student teacher startTime endTime",
  );
  if (session) query.session(session);

  const conflict = await query;
  if (!conflict) return;

  if (getId(conflict.teacher) === getId(teacher)) {
    throw new ApiError(
      409,
      `Teacher is already booked from ${conflict.startTime} to ${conflict.endTime}.`,
    );
  }

  throw new ApiError(
    409,
    `You already have a booking from ${conflict.startTime} to ${conflict.endTime}.`,
  );
};

const resolveMeetingType = ({ teacherLocation, meetingPreference }) => {
  if (teacherLocation.meetingType === "student_pickup") {
    return "student_pickup";
  }

  if (teacherLocation.meetingType === "both") {
    // A map booking already contains the student-selected point, so pickup is
    // the natural default. The frontend may explicitly request the teacher
    // meeting point by sending meetingPreference: "teacher_location".
    return meetingPreference === "teacher_location"
      ? "teacher_location"
      : "student_pickup";
  }

  return "teacher_location";
};

const getExpiryDate = () =>
  new Date(Date.now() + responseWindowMinutes() * 60 * 1000);

export const getTeacherAvailability = asyncHandler(async (req, res) => {
  const { teacher, date } = req.query;

  if (!teacher || !date) {
    throw new ApiError(400, "Teacher and date are required.");
  }

  const [occupiedSlots, availability] = await Promise.all([
    getOccupiedSlots(teacher, date),
    TeacherAvailability.findOne({ teacher }).lean(),
  ]);

  sendResponse(res, 200, "Teacher availability fetched successfully.", {
    teacher,
    date,
    occupiedSlots,
    availability,
  });
});

export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { teacher, date, duration = 60 } = req.query;

  if (!teacher || !date) {
    throw new ApiError(400, "Teacher and date are required.");
  }

  const [occupiedSlots, availability] = await Promise.all([
    getOccupiedSlots(teacher, date),
    TeacherAvailability.findOne({ teacher }).lean(),
  ]);

  const availableSlots = buildAvailableSlots({
    availability,
    bookingDate: date,
    duration: Number(duration),
    occupiedSlots,
  });

  sendResponse(res, 200, "Available slots fetched successfully.", {
    teacher,
    date,
    duration: Number(duration),
    availableSlots,
    occupiedSlots,
  });
});

export const createBooking = asyncHandler(async (req, res) => {
  const {
    teacher,
    offer,
    locationId,
    teacherVehicleId,
    vehicleType,
    bookingDate,
    startTime: rawStartTime,
    endTime: rawEndTime,
    studentLocation,
    meetingPreference,
  } = req.body;

  if (
    !teacher ||
    !locationId ||
    !teacherVehicleId ||
    !vehicleType ||
    !bookingDate ||
    !rawStartTime ||
    !rawEndTime
  ) {
    throw new ApiError(
      400,
      "Teacher, location, exact vehicle, date and time are required.",
    );
  }

  if (!mongoose.isValidObjectId(teacherVehicleId)) {
    throw new ApiError(400, "Selected vehicle is invalid.");
  }

  if (!VEHICLE_TYPES.includes(String(vehicleType).toLowerCase())) {
    throw new ApiError(
      400,
      "Vehicle type must be manual, automatic or electric.",
    );
  }

  const normalizedVehicleType = String(vehicleType).toLowerCase();

  const [profile, vehicle, teacherLocation, availability] = await Promise.all([
    TeacherProfile.findOne({
      user: teacher,
      verificationStatus: "verified",
      availabilityStatus: "available",
    }).populate("user", "status role"),
    TeacherVehicle.findOne({
      _id: teacherVehicleId,
      teacher,
      approvalStatus: "approved",
      status: "active",
    }),
    TeacherLocation.findOne({
      _id: locationId,
      teacher,
      status: "active",
    }),
    TeacherAvailability.findOne({ teacher }).lean(),
  ]);

  if (
    !profile?.user ||
    profile.user.status !== "active" ||
    profile.user.role !== "teacher"
  ) {
    throw new ApiError(400, "Selected teacher is not available.");
  }

  if (!vehicle) {
    throw new ApiError(
      400,
      "The selected vehicle does not belong to this teacher or is not admin-approved and active.",
    );
  }

  if (vehicle.vehicleType !== normalizedVehicleType) {
    throw new ApiError(
      400,
      "Selected vehicle type does not match the booking vehicle type.",
    );
  }

  if (!teacherLocation) {
    throw new ApiError(400, "Selected lesson location is unavailable.");
  }

  const { date } = getUtcDayRange(bookingDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (date < today) {
    throw new ApiError(400, "A booking cannot be created for a past date.");
  }

  const startTime = normalizeTime(rawStartTime, "Start time");
  const endTime = normalizeTime(rawEndTime, "End time");
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);

  if (duration < 30 || duration > 240) {
    throw new ApiError(
      400,
      "Lesson duration must be between 30 and 240 minutes.",
    );
  }

  if (
    !isTimeInsideWorkingSlots({
      availability,
      bookingDate: date,
      startTime,
      endTime,
    })
  ) {
    throw new ApiError(409, "Teacher is not working during the selected time.");
  }

  await expirePendingBookings({ student: req.user._id });
  await expirePendingBookings({ teacher });

  await ensureNoConflict({
    student: req.user._id,
    teacher,
    bookingDate: date,
    startTime,
    endTime,
  });

  const teacherPoint = locationPoint(teacherLocation);
  const studentLat = Number(studentLocation?.lat);
  const studentLng = Number(studentLocation?.lng);
  const hasStudentPoint =
    Number.isFinite(studentLat) && Number.isFinite(studentLng);

  const meetingType = resolveMeetingType({
    teacherLocation,
    meetingPreference,
  });

  if (meetingType === "student_pickup" && !hasStudentPoint) {
    throw new ApiError(
      400,
      "A valid student pickup point is required for this teacher location.",
    );
  }

  let distanceKm;
  if (teacherPoint && hasStudentPoint) {
    distanceKm = haversineDistanceKm(
      studentLat,
      studentLng,
      teacherPoint.lat,
      teacherPoint.lng,
    );

    if (distanceKm > Number(teacherLocation.serviceRadiusKm || 10)) {
      throw new ApiError(
        400,
        "This pickup/search point is outside the teacher's service radius.",
      );
    }
  }

  const studentSnapshot = hasStudentPoint
    ? makeStudentLocationSnapshot(studentLocation, "student_pickup")
    : undefined;

  const officialLocation =
    meetingType === "student_pickup"
      ? studentSnapshot
      : makeTeacherLocationSnapshot(teacherLocation, "teacher_location");

  const hourlyRate = Number(profile.hourlyRate) || 0;

  const booking = await Booking.create({
    student: req.user._id,
    teacher,
    offer: offer || undefined,
    teacherLocation: teacherLocation._id,
    teacherVehicle: vehicle._id,
    location: officialLocation,
    studentSearchLocation: studentSnapshot,
    vehicleSnapshot: makeVehicleSnapshot(vehicle),
    distanceKm: Number.isFinite(distanceKm)
      ? Number(distanceKm.toFixed(2))
      : undefined,
    vehicleType: vehicle.vehicleType,
    bookingDate: date,
    startTime,
    endTime,
    duration,
    pricingSnapshot: {
      hourlyRate,
      subtotal: Number(((hourlyRate * duration) / 60).toFixed(2)),
      currency: process.env.DEFAULT_CURRENCY || "EUR",
    },
    status: "pending",
    expiresAt: getExpiryDate(),
  });

  await createNotificationsSafely([
    {
      user: teacher,
      title: "New lesson booking request",
      message: "A student requested a driving lesson.",
      type: "booking",
      actionUrl: `/teacher/lessons?tab=requests&bookingId=${booking._id}`,
    },
    {
      user: req.user._id,
      title: "Booking request created",
      message: "Your request is waiting for teacher confirmation.",
      type: "booking",
      actionUrl: `/student/lessons?tab=requests&bookingId=${booking._id}`,
    },
  ]);

  const populated = await populateBooking(Booking.findById(booking._id));
  sendResponse(res, 201, "Booking request created successfully.", populated);
});

export const getBookings = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "student") filter.student = req.user._id;
  if (req.user.role === "teacher") filter.teacher = req.user._id;

  if (req.query.status && req.query.status !== "all") {
    if (!BOOKING_STATUSES.includes(req.query.status)) {
      throw new ApiError(400, "Invalid booking status.");
    }
    filter.status = req.query.status;
  }

  if (req.query.dateFrom || req.query.dateTo) {
    filter.bookingDate = {};
    if (req.query.dateFrom) {
      filter.bookingDate.$gte = getUtcDayRange(req.query.dateFrom).start;
    }
    if (req.query.dateTo) {
      filter.bookingDate.$lte = getUtcDayRange(req.query.dateTo).end;
    }
  }

  await expirePendingBookings(filter);

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  const roleFilter = {};
  if (req.user.role === "student") roleFilter.student = req.user._id;
  if (req.user.role === "teacher") roleFilter.teacher = req.user._id;

  const [bookings, total, statusRows] = await Promise.all([
    populateBooking(
      Booking.find(filter)
        .sort({ bookingDate: -1, startTime: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
    ),
    Booking.countDocuments(filter),
    Booking.aggregate([
      { $match: roleFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const statusCounts = statusRows.reduce(
    (result, row) => ({ ...result, [row._id]: row.count }),
    {},
  );
  statusCounts.all = statusRows.reduce((sum, row) => sum + row.count, 0);

  sendResponse(res, 200, "Bookings fetched successfully.", bookings, {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    statusCounts,
  });
});

export const getBooking = asyncHandler(async (req, res) => {
  await expirePendingBookings({ _id: req.params.id });

  const booking = await populateBooking(Booking.findById(req.params.id));

  if (!booking) throw new ApiError(404, "Booking not found.");
  if (!canAccessBooking(req.user, booking)) {
    throw new ApiError(403, "Access denied.");
  }

  sendResponse(res, 200, "Booking fetched successfully.", booking);
});

export const confirmBooking = asyncHandler(async (req, res) => {
  await expirePendingBookings({ _id: req.params.id });

  const session = await mongoose.startSession();
  let bookingId;
  let lessonId;

  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(req.params.id).session(session);

      if (!booking) throw new ApiError(404, "Booking not found.");

      if (
        req.user.role !== "teacher" ||
        getId(booking.teacher) !== getId(req.user._id)
      ) {
        throw new ApiError(
          403,
          "Only the assigned teacher can confirm this booking.",
        );
      }

      if (booking.status === "confirmed") {
        const existingLesson =
          (booking.lesson &&
            (await Lesson.findById(booking.lesson).session(session))) ||
          (await Lesson.findOne({ booking: booking._id }).session(session));

        if (existingLesson) {
          if (!booking.lesson) {
            booking.lesson = existingLesson._id;
            await booking.save({ session });
          }
          bookingId = booking._id;
          lessonId = existingLesson._id;
          return;
        }
      }

      if (booking.status !== "pending") {
        throw new ApiError(400, "Only pending bookings can be confirmed.");
      }

      const availabilityQuery = TeacherAvailability.findOne({
        teacher: booking.teacher,
      })
        .session(session)
        .lean();

      const locationQuery = booking.teacherLocation
        ? TeacherLocation.findOne({
            _id: booking.teacherLocation,
            teacher: booking.teacher,
            status: "active",
          }).session(session)
        : Promise.resolve(null);

      // Existing pending bookings created before this upgrade did not save a
      // teacherVehicle reference, so fall back to the approved active vehicle.
      const vehicleQuery = TeacherVehicle.findOne({
        ...(booking.teacherVehicle
          ? { _id: booking.teacherVehicle }
          : { vehicleType: booking.vehicleType }),
        teacher: booking.teacher,
        approvalStatus: "approved",
        status: "active",
      }).session(session);

      const [availability, location, vehicle] = await Promise.all([
        availabilityQuery,
        locationQuery,
        vehicleQuery,
      ]);

      if (booking.teacherLocation && !location) {
        throw new ApiError(
          409,
          "The selected teacher location is no longer active.",
        );
      }

      if (!vehicle) {
        throw new ApiError(
          409,
          "The selected teacher vehicle is no longer available.",
        );
      }

      if (!booking.teacherVehicle) booking.teacherVehicle = vehicle._id;
      if (!booking.vehicleSnapshot) {
        booking.vehicleSnapshot = makeVehicleSnapshot(vehicle);
      }

      if (
        !isTimeInsideWorkingSlots({
          availability,
          bookingDate: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
        })
      ) {
        throw new ApiError(
          409,
          "The teacher is no longer available during the selected time.",
        );
      }

      await ensureNoConflict({
        student: booking.student,
        teacher: booking.teacher,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        excludeBookingId: booking._id,
        session,
      });

      let lesson = await Lesson.findOne({ booking: booking._id }).session(
        session,
      );

      if (!lesson) {
        [lesson] = await Lesson.create(
          [
            {
              booking: booking._id,
              student: booking.student,
              teacher: booking.teacher,
              lessonDate: booking.bookingDate,
              startTime: booking.startTime,
              endTime: booking.endTime,
              duration: booking.duration,
              status: "scheduled",
              history: [
                {
                  action: "created_from_booking",
                  by: req.user._id,
                  note: "Lesson created after booking confirmation.",
                },
              ],
            },
          ],
          { session },
        );
      }

      booking.status = "confirmed";
      booking.lesson = lesson._id;
      booking.confirmation = {
        confirmedBy: req.user._id,
        confirmedAt: new Date(),
      };
      await booking.save({ session });

      bookingId = booking._id;
      lessonId = lesson._id;
    });
  } finally {
    await session.endSession();
  }

  const [booking, lesson] = await Promise.all([
    populateBooking(Booking.findById(bookingId)),
    Lesson.findById(lessonId)
      .populate("student", "name fullName email phone avatar")
      .populate("teacher", "name fullName email phone avatar")
      .populate("booking"),
  ]);

  await createNotificationsSafely([
    {
      user: booking.student?._id || booking.student,
      title: "Booking confirmed",
      message:
        "Your teacher confirmed the booking and your lesson is scheduled.",
      type: "booking",
      actionUrl: `/student/lessons?tab=upcoming&lessonId=${lesson._id}`,
    },
  ]);

  sendResponse(res, 200, "Booking confirmed and lesson created successfully.", {
    booking,
    lesson,
  });
});

export const rejectBooking = asyncHandler(async (req, res) => {
  await expirePendingBookings({ _id: req.params.id });

  const booking = await Booking.findById(req.params.id);

  if (!booking) throw new ApiError(404, "Booking not found.");

  if (
    req.user.role !== "teacher" ||
    getId(booking.teacher) !== getId(req.user._id)
  ) {
    throw new ApiError(
      403,
      "Only the assigned teacher can reject this booking.",
    );
  }

  if (booking.status !== "pending") {
    throw new ApiError(400, "Only pending bookings can be rejected.");
  }

  const reason = String(req.body.reason || "Teacher is unavailable.").trim();

  booking.status = "rejected";
  booking.rejection = {
    rejectedBy: req.user._id,
    reason,
    rejectedAt: new Date(),
  };
  await booking.save();

  await createNotificationsSafely([
    {
      user: booking.student,
      title: "Booking rejected",
      message: `Your booking was rejected. Reason: ${reason}`,
      type: "booking",
      actionUrl: `/student/lessons?tab=requests&bookingId=${booking._id}`,
    },
  ]);

  const populated = await populateBooking(Booking.findById(booking._id));
  sendResponse(res, 200, "Booking rejected successfully.", populated);
});

export const cancelBooking = asyncHandler(async (req, res) => {
  await expirePendingBookings({ _id: req.params.id });

  const reason = String(req.body.reason || "").trim();
  if (!reason) throw new ApiError(400, "Cancellation reason is required.");

  const session = await mongoose.startSession();
  let bookingId;
  let notifyUser;
  let actionUrl;

  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(req.params.id).session(session);

      if (!booking) throw new ApiError(404, "Booking not found.");
      if (!canAccessBooking(req.user, booking)) {
        throw new ApiError(403, "Access denied.");
      }

      if (
        ["cancelled", "rejected", "completed", "no_show", "expired"].includes(
          booking.status,
        )
      ) {
        throw new ApiError(400, "This booking cannot be cancelled.");
      }

      if (req.user.role === "student" && booking.status !== "pending") {
        throw new ApiError(
          400,
          "A confirmed lesson must be cancelled through the lesson cancellation request.",
        );
      }

      booking.status = "cancelled";
      booking.cancellation = {
        cancelledBy: req.user._id,
        reason,
        cancelledAt: new Date(),
      };
      await booking.save({ session });

      if (booking.lesson) {
        await Lesson.findOneAndUpdate(
          {
            _id: booking.lesson,
            status: { $in: ["scheduled", "in_progress"] },
          },
          {
            $set: {
              status: "cancelled",
              cancellation: {
                cancelledBy: req.user._id,
                reason,
                cancelledAt: new Date(),
              },
            },
            $push: {
              history: {
                action: "cancelled_from_booking",
                by: req.user._id,
                note: reason,
              },
            },
          },
          { session },
        );
      }

      bookingId = booking._id;
      notifyUser =
        req.user.role === "student" ? booking.teacher : booking.student;
      actionUrl =
        req.user.role === "student"
          ? `/teacher/lessons?tab=requests&bookingId=${booking._id}`
          : `/student/lessons?tab=requests&bookingId=${booking._id}`;
    });
  } finally {
    await session.endSession();
  }

  await createNotificationsSafely([
    {
      user: notifyUser,
      title: "Booking cancelled",
      message: `A booking was cancelled. Reason: ${reason}`,
      type: "booking",
      actionUrl,
    },
  ]);

  const populated = await populateBooking(Booking.findById(bookingId));
  sendResponse(res, 200, "Booking cancelled successfully.", populated);
});
