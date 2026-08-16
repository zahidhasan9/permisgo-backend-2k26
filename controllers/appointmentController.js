import Appointment from "../models/Appointment.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import TeacherProfile from "../models/TeacherProfile.js";

const clean = (value) => String(value ?? "").trim();

export const createAppointment = asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(clean(req.body.instructor))) {
    throw new ApiError(400, "Please select a valid instructor.");
  }
  const teacherProfile = await TeacherProfile.findOne({
    user: clean(req.body.instructor),
    verificationStatus: "verified",
    availabilityStatus: "available",
  }).populate({
    path: "user",
    match: { role: "teacher", status: "active" },
    select: "name",
  });
  if (!teacherProfile?.user)
    throw new ApiError(400, "The selected instructor is not available.");

  const appointmentDate = new Date(req.body.appointmentDate);
  const payload = {
    courseTitle: clean(req.body.courseTitle),
    instructor: teacherProfile.user._id,
    instructorName: teacherProfile.user.name,
    appointmentDate,
    appointmentTime: clean(req.body.appointmentTime),
    duration: Number(req.body.duration),
    name: clean(req.body.name),
    email: clean(req.body.email).toLowerCase(),
    phone: clean(req.body.phone),
    notes: clean(req.body.notes),
  };

  const required = [
    payload.courseTitle,
    payload.instructor,
    payload.appointmentTime,
    payload.name,
    payload.email,
    payload.phone,
  ];
  if (
    required.some((value) => !value) ||
    Number.isNaN(appointmentDate.getTime()) ||
    ![30, 60, 120].includes(payload.duration)
  ) {
    throw new ApiError(400, "Please complete all required appointment fields.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    throw new ApiError(400, "Please enter a valid email address.");
  }

  const appointment = await Appointment.create(payload);
  sendResponse(
    res,
    201,
    "Your appointment request has been submitted.",
    appointment,
  );
});

export const getAppointments = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const filter =
    req.query.status && req.query.status !== "all"
      ? { status: req.query.status }
      : {};
  const [items, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);
  const displayItems = items.map((item) => ({
    ...item,
    instructor:
      item.instructorName ||
      String(item.instructor || "Instructor unavailable"),
  }));
  sendResponse(res, 200, "Appointments fetched.", {
    items: displayItems,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  if (
    !["pending", "confirmed", "completed", "cancelled"].includes(
      req.body.status,
    )
  ) {
    throw new ApiError(400, "Invalid appointment status.");
  }
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { returnDocument: "after", runValidators: true },
  );
  if (!appointment) throw new ApiError(404, "Appointment not found.");
  sendResponse(res, 200, "Appointment status updated.", appointment);
});
