// import Booking from "../models/Booking.js";
// import TeacherAvailability from "../models/TeacherAvailability.js";
// import TeacherLocation from "../models/TeacherLocation.js";
// import TeacherProfile from "../models/TeacherProfile.js";
// import TeacherVehicle from "../models/TeacherVehicle.js";
// import ApiError from "../utils/ApiError.js";
// import sendResponse from "../utils/ApiResponse.js";
// import asyncHandler from "../utils/asyncHandler.js";
// import {
//   ACTIVE_BOOKING_STATUSES,
//   getUtcDayRange,
//   hasOccupiedConflict,
//   isTimeInsideWorkingSlots,
//   normalizeTime,
// } from "../utils/bookingAvailability.js";

// const parseCoordinate = (value, label, min, max) => {
//   const number = Number(value);
//   if (!Number.isFinite(number) || number < min || number > max) {
//     throw new ApiError(400, `${label} is invalid.`);
//   }
//   return number;
// };

// const buildLocationPayload = (body = {}) => {
//   const lat = parseCoordinate(
//     body.lat ?? body.coordinates?.lat ?? body.geoLocation?.coordinates?.[1],
//     "Latitude",
//     -90,
//     90,
//   );
//   const lng = parseCoordinate(
//     body.lng ?? body.coordinates?.lng ?? body.geoLocation?.coordinates?.[0],
//     "Longitude",
//     -180,
//     180,
//   );
//   const address = String(body.address || "").trim();
//   if (!address) throw new ApiError(400, "Address is required.");

//   return {
//     title: String(body.title || "Lesson meeting point").trim(),
//     address,
//     city: String(body.city || "").trim(),
//     postalCode: String(body.postalCode || "").trim(),
//     placeId: String(body.placeId || "").trim(),
//     coordinates: { lat, lng },
//     geoLocation: { type: "Point", coordinates: [lng, lat] },
//     serviceRadiusKm: Math.min(100, Math.max(1, Number(body.serviceRadiusKm) || 10)),
//     meetingType: ["teacher_location", "student_pickup", "both"].includes(
//       body.meetingType,
//     )
//       ? body.meetingType
//       : "teacher_location",
//     status: body.status === "inactive" ? "inactive" : "active",
//   };
// };

// export const getMyLocations = asyncHandler(async (req, res) => {
//   const locations = await TeacherLocation.find({ teacher: req.user._id }).sort({
//     createdAt: -1,
//   });
//   sendResponse(res, 200, "Locations fetched successfully.", locations);
// });

// export const createMyLocation = asyncHandler(async (req, res) => {
//   const payload = buildLocationPayload(req.body);
//   const location = await TeacherLocation.create({
//     ...payload,
//     teacher: req.user._id,
//   });

//   await TeacherProfile.findOneAndUpdate(
//     { user: req.user._id },
//     {
//       $setOnInsert: { user: req.user._id },
//       $addToSet: { locations: location._id },
//     },
//     { upsert: true, setDefaultsOnInsert: true },
//   );

//   sendResponse(res, 201, "Location created successfully.", location);
// });

// export const updateMyLocation = asyncHandler(async (req, res) => {
//   const location = await TeacherLocation.findOne({
//     _id: req.params.id,
//     teacher: req.user._id,
//   });
//   if (!location) throw new ApiError(404, "Location not found.");

//   Object.assign(location, buildLocationPayload({ ...location.toObject(), ...req.body }));
//   await location.save();
//   sendResponse(res, 200, "Location updated successfully.", location);
// });

// export const deleteMyLocation = asyncHandler(async (req, res) => {
//   const location = await TeacherLocation.findOne({
//     _id: req.params.id,
//     teacher: req.user._id,
//   });
//   if (!location) throw new ApiError(404, "Location not found.");

//   const activeBooking = await Booking.findOne({
//     teacherLocation: location._id,
//     status: { $in: ACTIVE_BOOKING_STATUSES },
//   }).select("_id");
//   if (activeBooking) {
//     throw new ApiError(409, "This location has an active booking and cannot be deleted.");
//   }

//   await TeacherProfile.findOneAndUpdate(
//     { user: req.user._id },
//     { $pull: { locations: location._id } },
//   );
//   await location.deleteOne();
//   sendResponse(res, 200, "Location deleted successfully.");
// });

// export const getNearbyTeachers = asyncHandler(async (req, res) => {
//   const lat = parseCoordinate(req.query.lat, "Latitude", -90, 90);
//   const lng = parseCoordinate(req.query.lng, "Longitude", -180, 180);
//   const radiusKm = Math.min(100, Math.max(1, Number(req.query.radius) || 10));
//   const vehicleType = ["manual", "automatic"].includes(req.query.vehicleType)
//     ? req.query.vehicleType
//     : "";

//   let startTime = "";
//   let endTime = "";
//   let dateRange = null;
//   if (req.query.date && req.query.startTime && req.query.endTime) {
//     startTime = normalizeTime(req.query.startTime, "Start time");
//     endTime = normalizeTime(req.query.endTime, "End time");
//     dateRange = getUtcDayRange(req.query.date);
//   }

//   const locations = await TeacherLocation.aggregate([
//     {
//       $geoNear: {
//         near: { type: "Point", coordinates: [lng, lat] },
//         key: "geoLocation",
//         distanceField: "distanceMeters",
//         spherical: true,
//         maxDistance: radiusKm * 1000,
//         query: { status: "active" },
//       },
//     },
//     { $sort: { distanceMeters: 1 } },
//     { $limit: 200 },
//   ]);

//   const nearestByTeacher = new Map();
//   locations.forEach((location) => {
//     const distanceKm = location.distanceMeters / 1000;
//     if (distanceKm > Number(location.serviceRadiusKm || radiusKm)) return;
//     const teacherId = String(location.teacher);
//     if (!nearestByTeacher.has(teacherId)) {
//       nearestByTeacher.set(teacherId, { ...location, distanceKm });
//     }
//   });

//   const teacherIds = [...nearestByTeacher.keys()];
//   if (!teacherIds.length) {
//     return sendResponse(res, 200, "No nearby teachers found.", []);
//   }

//   const [profiles, vehicles, availabilities, bookings] = await Promise.all([
//     TeacherProfile.find({
//       user: { $in: teacherIds },
//       verificationStatus: "verified",
//       availabilityStatus: "available",
//     })
//       .populate({
//         path: "user",
//         match: { status: "active", role: "teacher" },
//         select: "name email phone avatar city address bio",
//       })
//       .lean(),
//     TeacherVehicle.find({
//       teacher: { $in: teacherIds },
//       status: "active",
//       ...(vehicleType ? { vehicleType } : {}),
//     }).lean(),
//     dateRange
//       ? TeacherAvailability.find({ teacher: { $in: teacherIds } }).lean()
//       : Promise.resolve([]),
//     dateRange
//       ? Booking.find({
//           teacher: { $in: teacherIds },
//           bookingDate: { $gte: dateRange.start, $lte: dateRange.end },
//           status: { $in: ACTIVE_BOOKING_STATUSES },
//         })
//           .select("teacher startTime endTime")
//           .lean()
//       : Promise.resolve([]),
//   ]);

//   const vehiclesByTeacher = new Map();
//   vehicles.forEach((vehicle) => {
//     const key = String(vehicle.teacher);
//     vehiclesByTeacher.set(key, [...(vehiclesByTeacher.get(key) || []), vehicle]);
//   });
//   const availabilityByTeacher = new Map(
//     availabilities.map((item) => [String(item.teacher), item]),
//   );
//   const bookingsByTeacher = new Map();
//   bookings.forEach((booking) => {
//     const key = String(booking.teacher);
//     bookingsByTeacher.set(key, [...(bookingsByTeacher.get(key) || []), booking]);
//   });

//   const results = profiles
//     .filter((profile) => profile.user)
//     .map((profile) => {
//       const teacherId = String(profile.user._id);
//       const teacherVehicles = vehiclesByTeacher.get(teacherId) || [];
//       if (!teacherVehicles.length) return null;

//       if (dateRange) {
//         const availability = availabilityByTeacher.get(teacherId);
//         if (
//           !isTimeInsideWorkingSlots({
//             availability,
//             bookingDate: dateRange.date,
//             startTime,
//             endTime,
//           })
//         ) {
//           return null;
//         }
//         if (
//           hasOccupiedConflict({
//             startTime,
//             endTime,
//             occupiedSlots: bookingsByTeacher.get(teacherId) || [],
//             bufferMinutes: availability?.bufferMinutes || 0,
//           })
//         ) {
//           return null;
//         }
//       }

//       const location = nearestByTeacher.get(teacherId);
//       return {
//         ...profile,
//         vehicles: teacherVehicles,
//         nearestLocation: location,
//         locations: [location],
//         distanceKm: Number(location.distanceKm.toFixed(2)),
//       };
//     })
//     .filter(Boolean)
//     .sort((a, b) => a.distanceKm - b.distanceKm);

//   sendResponse(res, 200, "Nearby teachers fetched successfully.", results, {
//     center: { lat, lng },
//     radiusKm,
//     count: results.length,
//   });
// });

import Booking from "../models/Booking.js";
import TeacherAvailability from "../models/TeacherAvailability.js";
import TeacherLocation from "../models/TeacherLocation.js";
import TeacherProfile from "../models/TeacherProfile.js";
import TeacherVehicle from "../models/TeacherVehicle.js";
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

const parseCoordinate = (value, label, min, max) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < min || number > max) {
    throw new ApiError(400, `${label} is invalid.`);
  }

  return number;
};

const buildLocationPayload = (body = {}) => {
  const lat = parseCoordinate(
    body.lat ?? body.coordinates?.lat ?? body.geoLocation?.coordinates?.[1],
    "Latitude",
    -90,
    90,
  );

  const lng = parseCoordinate(
    body.lng ?? body.coordinates?.lng ?? body.geoLocation?.coordinates?.[0],
    "Longitude",
    -180,
    180,
  );

  const address = String(body.address || "").trim();

  if (!address) {
    throw new ApiError(400, "Address is required.");
  }

  return {
    title: String(body.title || "Lesson meeting point").trim(),
    address,
    city: String(body.city || "").trim(),
    postalCode: String(body.postalCode || "").trim(),
    placeId: String(body.placeId || "").trim(),
    coordinates: { lat, lng },
    geoLocation: { type: "Point", coordinates: [lng, lat] },
    serviceRadiusKm: Math.min(
      100,
      Math.max(1, Number(body.serviceRadiusKm) || 10),
    ),
    meetingType: ["teacher_location", "student_pickup", "both"].includes(
      body.meetingType,
    )
      ? body.meetingType
      : "teacher_location",
    status: body.status === "inactive" ? "inactive" : "active",
  };
};

export const getMyLocations = asyncHandler(async (req, res) => {
  const locations = await TeacherLocation.find({
    teacher: req.user._id,
  }).sort({ createdAt: -1 });

  sendResponse(res, 200, "Locations fetched successfully.", locations);
});

export const createMyLocation = asyncHandler(async (req, res) => {
  const payload = buildLocationPayload(req.body);

  const location = await TeacherLocation.create({
    ...payload,
    teacher: req.user._id,
  });

  await TeacherProfile.findOneAndUpdate(
    { user: req.user._id },
    {
      $setOnInsert: { user: req.user._id },
      $addToSet: { locations: location._id },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  sendResponse(res, 201, "Location created successfully.", location);
});

export const updateMyLocation = asyncHandler(async (req, res) => {
  const location = await TeacherLocation.findOne({
    _id: req.params.id,
    teacher: req.user._id,
  });

  if (!location) {
    throw new ApiError(404, "Location not found.");
  }

  Object.assign(
    location,
    buildLocationPayload({ ...location.toObject(), ...req.body }),
  );

  await location.save();

  sendResponse(res, 200, "Location updated successfully.", location);
});

export const deleteMyLocation = asyncHandler(async (req, res) => {
  const location = await TeacherLocation.findOne({
    _id: req.params.id,
    teacher: req.user._id,
  });

  if (!location) {
    throw new ApiError(404, "Location not found.");
  }

  const activeBooking = await Booking.findOne({
    teacherLocation: location._id,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  }).select("_id");

  if (activeBooking) {
    throw new ApiError(
      409,
      "This location has an active booking and cannot be deleted.",
    );
  }

  await TeacherProfile.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { locations: location._id } },
  );

  await location.deleteOne();

  sendResponse(res, 200, "Location deleted successfully.");
});

export const getNearbyTeachers = asyncHandler(async (req, res) => {
  const lat = parseCoordinate(req.query.lat, "Latitude", -90, 90);
  const lng = parseCoordinate(req.query.lng, "Longitude", -180, 180);
  const radiusKm = Math.min(100, Math.max(1, Number(req.query.radius) || 10));

  const vehicleType = ["manual", "automatic", "electric"].includes(
    req.query.vehicleType,
  )
    ? req.query.vehicleType
    : "";

  let startTime = "";
  let endTime = "";
  let dateRange = null;

  if (req.query.date && req.query.startTime && req.query.endTime) {
    startTime = normalizeTime(req.query.startTime, "Start time");
    endTime = normalizeTime(req.query.endTime, "End time");
    dateRange = getUtcDayRange(req.query.date);
  }

  const locations = await TeacherLocation.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        key: "geoLocation",
        distanceField: "distanceMeters",
        spherical: true,
        maxDistance: radiusKm * 1000,
        query: { status: "active" },
      },
    },
    { $sort: { distanceMeters: 1 } },
    { $limit: 200 },
  ]);

  const nearestByTeacher = new Map();

  locations.forEach((location) => {
    const distanceKm = location.distanceMeters / 1000;

    if (distanceKm > Number(location.serviceRadiusKm || radiusKm)) {
      return;
    }

    const teacherId = String(location.teacher);

    if (!nearestByTeacher.has(teacherId)) {
      nearestByTeacher.set(teacherId, { ...location, distanceKm });
    }
  });

  const teacherIds = [...nearestByTeacher.keys()];

  if (!teacherIds.length) {
    return sendResponse(res, 200, "No nearby teachers found.", []);
  }

  const [profiles, vehicles, availabilities, bookings] = await Promise.all([
    TeacherProfile.find({
      user: { $in: teacherIds },
      verificationStatus: "verified",
      availabilityStatus: "available",
    })
      .populate({
        path: "user",
        match: { status: "active", role: "teacher" },
        select: "name email phone avatar city address bio",
      })
      .lean(),

    TeacherVehicle.find({
      teacher: { $in: teacherIds },
      approvalStatus: "approved",
      status: "active",
      ...(vehicleType ? { vehicleType } : {}),
    })
      .select(
        "_id teacher vehicleName vehicleType brand model modelYear registrationNumber vehicleImage isDefault approvalStatus status",
      )
      .lean(),

    dateRange
      ? TeacherAvailability.find({ teacher: { $in: teacherIds } }).lean()
      : Promise.resolve([]),

    dateRange
      ? Booking.find({
          teacher: { $in: teacherIds },
          bookingDate: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $in: ACTIVE_BOOKING_STATUSES },
        })
          .select("teacher startTime endTime")
          .lean()
      : Promise.resolve([]),
  ]);

  const vehiclesByTeacher = new Map();

  vehicles.forEach((vehicle) => {
    const key = String(vehicle.teacher);
    vehiclesByTeacher.set(key, [
      ...(vehiclesByTeacher.get(key) || []),
      vehicle,
    ]);
  });

  const availabilityByTeacher = new Map(
    availabilities.map((item) => [String(item.teacher), item]),
  );

  const bookingsByTeacher = new Map();

  bookings.forEach((booking) => {
    const key = String(booking.teacher);
    bookingsByTeacher.set(key, [
      ...(bookingsByTeacher.get(key) || []),
      booking,
    ]);
  });

  const results = profiles
    .filter((profile) => profile.user)
    .map((profile) => {
      const teacherId = String(profile.user._id);
      const teacherVehicles = vehiclesByTeacher.get(teacherId) || [];

      if (!teacherVehicles.length) {
        return null;
      }

      if (dateRange) {
        const availability = availabilityByTeacher.get(teacherId);

        if (
          !isTimeInsideWorkingSlots({
            availability,
            bookingDate: dateRange.date,
            startTime,
            endTime,
          })
        ) {
          return null;
        }

        if (
          hasOccupiedConflict({
            startTime,
            endTime,
            occupiedSlots: bookingsByTeacher.get(teacherId) || [],
            bufferMinutes: availability?.bufferMinutes || 0,
          })
        ) {
          return null;
        }
      }

      const location = nearestByTeacher.get(teacherId);

      return {
        ...profile,
        vehicles: teacherVehicles,
        nearestLocation: location,
        locations: [location],
        distanceKm: Number(location.distanceKm.toFixed(2)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  sendResponse(res, 200, "Nearby teachers fetched successfully.", results, {
    center: { lat, lng },
    radiusKm,
    count: results.length,
  });
});
