import TeacherProfile from "../models/TeacherProfile";
import TeacherVehicle from "../models/TeacherVehicle";
import TeacherLocation from "../models/TeacherLocation";
import Lesson from "../models/Lesson";
import Booking from "../models/Booking";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const getPublicTeachers = asyncHandler(async (req, res) => {
  const teachers = await TeacherProfile.find({ verificationStatus: "verified" })
    .populate("user", "name email phone avatar")
    .populate("vehicles locations");
  sendResponse(res, 200, "Teachers fetched.", teachers);
});

export const getDashboard = asyncHandler(async (req, res) => {
  const [profile, lessons, bookings, vehicles, locations] = await Promise.all([
    TeacherProfile.findOne({ user: req.user._id }),
    Lesson.countDocuments({ teacher: req.user._id }),
    Booking.countDocuments({ teacher: req.user._id }),
    TeacherVehicle.countDocuments({ teacher: req.user._id }),
    TeacherLocation.countDocuments({ teacher: req.user._id }),
  ]);

  sendResponse(res, 200, "Teacher dashboard fetched.", {
    profile,
    stats: { lessons, bookings, vehicles, locations },
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await TeacherProfile.findOne({ user: req.user._id })
    .populate("user", "name email phone avatar")
    .populate("vehicles locations documents");
  if (!profile) throw new ApiError(404, "Teacher profile not found.");
  sendResponse(res, 200, "Teacher profile fetched.", profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await TeacherProfile.findOneAndUpdate(
    { user: req.user._id },
    req.body,
    { new: true, runValidators: true },
  );
  if (!profile) throw new ApiError(404, "Teacher profile not found.");
  sendResponse(res, 200, "Teacher profile updated.", profile);
});

export const addVehicle = asyncHandler(async (req, res) => {
  const vehicle = await TeacherVehicle.create({
    ...req.body,
    teacher: req.user._id,
  });
  await TeacherProfile.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { vehicles: vehicle._id } },
  );
  sendResponse(res, 201, "Vehicle added.", vehicle);
});

export const getVehicles = asyncHandler(async (req, res) => {
  const vehicles = await TeacherVehicle.find({ teacher: req.user._id });
  sendResponse(res, 200, "Vehicles fetched.", vehicles);
});

export const addLocation = asyncHandler(async (req, res) => {
  const location = await TeacherLocation.create({
    ...req.body,
    teacher: req.user._id,
  });
  await TeacherProfile.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { locations: location._id } },
  );
  sendResponse(res, 201, "Location added.", location);
});

export const getLocations = asyncHandler(async (req, res) => {
  const locations = await TeacherLocation.find({ teacher: req.user._id });
  sendResponse(res, 200, "Locations fetched.", locations);
});
