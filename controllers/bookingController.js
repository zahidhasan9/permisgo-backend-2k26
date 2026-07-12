// import Booking from "../models/Booking";
// import Lesson from "../models/Lesson";
// import Notification from "../models/Notification";
// import ROLES from "../importants/roles";
// import asyncHandler from "../utils/asyncHandler";
// import sendResponse from "../utils/ApiResponse";
// import ApiError from "../utils/ApiError";

// export const createBooking = asyncHandler(async (req, res) => {
//   const booking = await Booking.create({ ...req.body, student: req.user._id });

//   await Notification.create([
//     {
//       user: booking.teacher,
//       title: "New lesson booking request",
//       message: "A student requested a driving lesson.",
//       type: "booking",
//       actionUrl: `/teacher/lessons`,
//     },
//     {
//       user: booking.student,
//       title: "Booking request created",
//       message: "Your lesson booking request has been created.",
//       type: "booking",
//       actionUrl: `/student/lessons`,
//     },
//   ]);

//   sendResponse(res, 201, "Booking created.", booking);
// });

// export const getBookings = asyncHandler(async (req, res) => {
//   const filter = {};
//   if (req.user.role === ROLES.STUDENT) filter.student = req.user._id;
//   if (req.user.role === ROLES.TEACHER) filter.teacher = req.user._id;

//   const bookings = await Booking.find(filter)
//     .populate("student", "name email phone")
//     .populate("teacher", "name email phone")
//     .populate("offer", "title salePrice category")
//     .sort({ createdAt: -1 });

//   sendResponse(res, 200, "Bookings fetched.", bookings);
// });

// export const getBooking = asyncHandler(async (req, res) => {
//   const booking = await Booking.findById(req.params.id)
//     .populate("student", "name email phone")
//     .populate("teacher", "name email phone")
//     .populate("offer");

//   if (!booking) throw new ApiError(404, "Booking not found.");
//   sendResponse(res, 200, "Booking fetched.", booking);
// });

// export const confirmBooking = asyncHandler(async (req, res) => {
//   const booking = await Booking.findById(req.params.id);
//   if (!booking) throw new ApiError(404, "Booking not found.");

//   booking.status = "confirmed";
//   await booking.save();

//   const lesson = await Lesson.create({
//     booking: booking._id,
//     student: booking.student,
//     teacher: booking.teacher,
//     lessonDate: booking.bookingDate,
//     startTime: booking.startTime,
//     endTime: booking.endTime,
//     duration: booking.duration,
//   });

//   await Notification.create({
//     user: booking.student,
//     title: "Booking confirmed",
//     message: "Your lesson has been confirmed.",
//     type: "booking",
//     actionUrl: `/student/lessons/${lesson._id}`,
//   });

//   sendResponse(res, 200, "Booking confirmed and lesson created.", {
//     booking,
//     lesson,
//   });
// });

// export const cancelBooking = asyncHandler(async (req, res) => {
//   const booking = await Booking.findById(req.params.id);
//   if (!booking) throw new ApiError(404, "Booking not found.");

//   booking.status = "cancelled";
//   booking.cancellation = {
//     cancelledBy: req.user._id,
//     reason: req.body.reason,
//     cancelledAt: new Date(),
//   };
//   await booking.save();

//   sendResponse(res, 200, "Booking cancelled.", booking);
// });

import Booking from "../models/Booking.js";
import Lesson from "../models/Lesson.js";
import Notification from "../models/Notification.js";
import TeacherLocation from "../models/TeacherLocation.js";
import TeacherProfile from "../models/TeacherProfile.js";
import TeacherVehicle from "../models/TeacherVehicle.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"];

const VEHICLE_TYPES = ["manual", "automatic"];

const getId = (value) => {
  return String(value?._id || value || "");
};

const parseBookingDate = (value) => {
  if (!value) {
    throw new ApiError(400, "Booking date is required.");
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Invalid booking date.");
  }

  return date;
};

const getUtcDayRange = (value) => {
  const date = parseBookingDate(value);

  const start = new Date(date);

  const end = new Date(date);

  start.setUTCHours(0, 0, 0, 0);

  end.setUTCHours(23, 59, 59, 999);

  return {
    date: start,
    start,
    end,
  };
};

const normalizeTime = (value, label) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    throw new ApiError(400, `${label} must use HH:mm format.`);
  }

  const hour = Number(match[1]);

  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    throw new ApiError(400, `Invalid ${label.toLowerCase()}.`);
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const timeToMinutes = (value) => {
  const [hour, minute] = value.split(":").map(Number);

  return hour * 60 + minute;
};

const createNotificationsSafely = async (notifications) => {
  try {
    await Notification.create(notifications);
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

const populateBooking = (query) => {
  return query
    .populate("student", "name email phone avatar")
    .populate("teacher", "name email phone avatar")
    .populate("offer", "title salePrice category");
};

const canAccessBooking = (user, booking) => {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "student") {
    return getId(booking.student) === getId(user);
  }

  if (user.role === "teacher") {
    return getId(booking.teacher) === getId(user);
  }

  return false;
};

const ensureNoBookingConflict = async ({
  student,
  teacher,
  bookingDate,
  startTime,
  endTime,
}) => {
  const { start, end } = getUtcDayRange(bookingDate);

  const conflict = await Booking.findOne({
    status: {
      $in: ACTIVE_BOOKING_STATUSES,
    },

    bookingDate: {
      $gte: start,
      $lte: end,
    },

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
  }).select("student teacher startTime endTime");

  if (!conflict) {
    return;
  }

  if (getId(conflict.teacher) === getId(teacher)) {
    throw new ApiError(
      409,
      `The teacher is already booked from ${conflict.startTime} to ${conflict.endTime}.`,
    );
  }

  throw new ApiError(
    409,
    `You already have another booking from ${conflict.startTime} to ${conflict.endTime}.`,
  );
};

/**
 * GET /api/bookings/availability
 *
 * Teacher-এর কোন সময়গুলো occupied তা return করবে।
 */
export const getTeacherAvailability = asyncHandler(async (req, res) => {
  const { teacher, date } = req.query;

  if (!teacher || !date) {
    throw new ApiError(400, "Teacher and date are required.");
  }

  const { start, end } = getUtcDayRange(date);

  const occupiedSlots = await Booking.find({
    teacher,

    bookingDate: {
      $gte: start,
      $lte: end,
    },

    status: {
      $in: ACTIVE_BOOKING_STATUSES,
    },
  })
    .select("startTime endTime status")
    .sort({
      startTime: 1,
    });

  sendResponse(res, 200, "Teacher occupied slots fetched successfully.", {
    teacher,
    date,
    occupiedSlots,
  });
});

/**
 * POST /api/bookings
 *
 * Student booking request করবে।
 * এখানে Lesson তৈরি হবে না।
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    teacher,
    offer,
    locationId,
    vehicleType,
    bookingDate,
    startTime: rawStartTime,
    endTime: rawEndTime,
  } = req.body;

  if (
    !teacher ||
    !vehicleType ||
    !bookingDate ||
    !rawStartTime ||
    !rawEndTime
  ) {
    throw new ApiError(
      400,
      "Teacher, vehicle type, booking date, start time and end time are required.",
    );
  }

  if (!VEHICLE_TYPES.includes(vehicleType)) {
    throw new ApiError(400, "Vehicle type must be manual or automatic.");
  }

  const teacherProfile = await TeacherProfile.findOne({
    user: teacher,

    verificationStatus: "verified",

    availabilityStatus: "available",
  }).populate("user", "name status role");

  if (
    !teacherProfile ||
    !teacherProfile.user ||
    teacherProfile.user.status !== "active" ||
    teacherProfile.user.role !== "teacher"
  ) {
    throw new ApiError(400, "The selected teacher is not available.");
  }

  const matchingVehicle = await TeacherVehicle.findOne({
    teacher,
    vehicleType,
    status: "active",
  });

  if (!matchingVehicle) {
    throw new ApiError(
      400,
      `The selected teacher does not have an active ${vehicleType} vehicle.`,
    );
  }

  if (!locationId) {
    throw new ApiError(400, "Please select a lesson location.");
  }

  const selectedLocation = await TeacherLocation.findOne({
    _id: locationId,
    teacher,
    status: "active",
  });

  if (!selectedLocation) {
    throw new ApiError(400, "The selected lesson location is not available.");
  }

  const location = {
    address: selectedLocation.address,

    city: selectedLocation.city,

    lat: selectedLocation.coordinates?.lat,

    lng: selectedLocation.coordinates?.lng,
  };

  const { date } = getUtcDayRange(bookingDate);

  const today = new Date();

  today.setUTCHours(0, 0, 0, 0);

  if (date < today) {
    throw new ApiError(400, "A booking cannot be created for a past date.");
  }

  const startTime = normalizeTime(rawStartTime, "Start time");

  const endTime = normalizeTime(rawEndTime, "End time");

  const startMinutes = timeToMinutes(startTime);

  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    throw new ApiError(400, "End time must be after start time.");
  }

  const duration = endMinutes - startMinutes;

  if (duration < 30 || duration > 240) {
    throw new ApiError(
      400,
      "Lesson duration must be between 30 and 240 minutes.",
    );
  }

  await ensureNoBookingConflict({
    student: req.user._id,

    teacher,

    bookingDate: date,

    startTime,

    endTime,
  });

  const booking = await Booking.create({
    student: req.user._id,

    teacher,

    offer: offer || undefined,

    location,

    vehicleType,

    bookingDate: date,

    startTime,

    endTime,

    duration,

    status: "pending",
  });

  await createNotificationsSafely([
    {
      user: teacher,

      title: "New lesson booking request",

      message: "A student requested a driving lesson.",

      type: "booking",

      actionUrl: "/teacher/lessons",
    },

    {
      user: req.user._id,

      title: "Booking request created",

      message: "Your booking request is waiting for teacher confirmation.",

      type: "booking",

      actionUrl: "/student/lessons",
    },
  ]);

  const populatedBooking = await populateBooking(Booking.findById(booking._id));

  sendResponse(
    res,
    201,
    "Booking request created successfully.",
    populatedBooking,
  );
});

/**
 * GET /api/bookings
 */
export const getBookings = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "student") {
    filter.student = req.user._id;
  }

  if (req.user.role === "teacher") {
    filter.teacher = req.user._id;
  }

  if (req.query.status && req.query.status !== "all") {
    filter.status = req.query.status;
  }

  const bookings = await populateBooking(
    Booking.find(filter).sort({
      bookingDate: -1,

      startTime: -1,
    }),
  );

  sendResponse(res, 200, "Bookings fetched successfully.", bookings);
});

/**
 * GET /api/bookings/:id
 */
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.id));

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  if (!canAccessBooking(req.user, booking)) {
    throw new ApiError(403, "You are not allowed to access this booking.");
  }

  sendResponse(res, 200, "Booking fetched successfully.", booking);
});

/**
 * PATCH /api/bookings/:id/confirm
 *
 * Teacher confirm করলে Lesson automatic তৈরি হবে।
 */
export const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  const isAssignedTeacher = getId(booking.teacher) === getId(req.user);

  if (req.user.role !== "admin" && !isAssignedTeacher) {
    throw new ApiError(
      403,
      "Only the assigned teacher can confirm this booking.",
    );
  }

  const existingLesson = await Lesson.findOne({
    booking: booking._id,
  });

  if (booking.status === "confirmed" && existingLesson) {
    return sendResponse(res, 200, "Booking is already confirmed.", {
      booking,
      lesson: existingLesson,
    });
  }

  if (booking.status !== "pending") {
    throw new ApiError(400, "Only a pending booking can be confirmed.");
  }

  const lesson = await Lesson.create({
    booking: booking._id,

    student: booking.student,

    teacher: booking.teacher,

    lessonDate: booking.bookingDate,

    startTime: booking.startTime,

    endTime: booking.endTime,

    duration: booking.duration,

    status: "scheduled",
  });

  try {
    booking.status = "confirmed";

    await booking.save();
  } catch (error) {
    await Lesson.findByIdAndDelete(lesson._id);

    throw error;
  }

  await createNotificationsSafely([
    {
      user: booking.student,

      title: "Booking confirmed",

      message:
        "Your teacher confirmed the booking and your lesson is now scheduled.",

      type: "booking",

      actionUrl: `/student/lessons/${lesson._id}`,
    },
  ]);

  sendResponse(res, 200, "Booking confirmed and lesson created successfully.", {
    booking,
    lesson,
  });
});

/**
 * PATCH /api/bookings/:id/cancel
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  if (!canAccessBooking(req.user, booking)) {
    throw new ApiError(403, "You are not allowed to cancel this booking.");
  }

  if (["cancelled", "completed"].includes(booking.status)) {
    throw new ApiError(400, "This booking cannot be cancelled.");
  }

  const reason = String(req.body.reason || "").trim();

  if (!reason) {
    throw new ApiError(400, "Cancellation reason is required.");
  }

  booking.status = "cancelled";

  booking.cancellation = {
    cancelledBy: req.user._id,

    reason,

    cancelledAt: new Date(),
  };

  await booking.save();

  await Lesson.findOneAndUpdate(
    {
      booking: booking._id,

      status: {
        $in: ["scheduled", "in_progress"],
      },
    },
    {
      status: "cancelled",
    },
  );

  const notifyUser =
    req.user.role === "student" ? booking.teacher : booking.student;

  await createNotificationsSafely([
    {
      user: notifyUser,

      title: "Booking cancelled",

      message: `A booking was cancelled. Reason: ${reason}`,

      type: "booking",

      actionUrl:
        req.user.role === "student" ? "/teacher/lessons" : "/student/lessons",
    },
  ]);

  const populatedBooking = await populateBooking(Booking.findById(booking._id));

  sendResponse(res, 200, "Booking cancelled successfully.", populatedBooking);
});
