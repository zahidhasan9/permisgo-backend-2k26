import Booking from "../models/Booking";
import Lesson from "../models/Lesson";
import Notification from "../models/Notification";
import ROLES from "../importants/roles";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.create({ ...req.body, student: req.user._id });

  await Notification.create([
    {
      user: booking.teacher,
      title: "New lesson booking request",
      message: "A student requested a driving lesson.",
      type: "booking",
      actionUrl: `/teacher/lessons`,
    },
    {
      user: booking.student,
      title: "Booking request created",
      message: "Your lesson booking request has been created.",
      type: "booking",
      actionUrl: `/student/lessons`,
    },
  ]);

  sendResponse(res, 201, "Booking created.", booking);
});

export const getBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.STUDENT) filter.student = req.user._id;
  if (req.user.role === ROLES.TEACHER) filter.teacher = req.user._id;

  const bookings = await Booking.find(filter)
    .populate("student", "name email phone")
    .populate("teacher", "name email phone")
    .populate("offer", "title salePrice category")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "Bookings fetched.", bookings);
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("student", "name email phone")
    .populate("teacher", "name email phone")
    .populate("offer");

  if (!booking) throw new ApiError(404, "Booking not found.");
  sendResponse(res, 200, "Booking fetched.", booking);
});

export const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found.");

  booking.status = "confirmed";
  await booking.save();

  const lesson = await Lesson.create({
    booking: booking._id,
    student: booking.student,
    teacher: booking.teacher,
    lessonDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    duration: booking.duration,
  });

  await Notification.create({
    user: booking.student,
    title: "Booking confirmed",
    message: "Your lesson has been confirmed.",
    type: "booking",
    actionUrl: `/student/lessons/${lesson._id}`,
  });

  sendResponse(res, 200, "Booking confirmed and lesson created.", {
    booking,
    lesson,
  });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, "Booking not found.");

  booking.status = "cancelled";
  booking.cancellation = {
    cancelledBy: req.user._id,
    reason: req.body.reason,
    cancelledAt: new Date(),
  };
  await booking.save();

  sendResponse(res, 200, "Booking cancelled.", booking);
});
