// import mongoose from "mongoose";

// const teacherLocationSchema = new mongoose.Schema(
//   {
//     teacher: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     title: String,
//     address: { type: String, required: true },
//     city: String,
//     postalCode: String,
//     coordinates: {
//       lat: Number,
//       lng: Number,
//     },
//     status: { type: String, enum: ["active", "inactive"], default: "active" },
//   },
//   { timestamps: true },
// );

// teacherLocationSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });

// const TeacherLocation = mongoose.model(
//   "TeacherLocation",
//   teacherLocationSchema,
// );
// export default TeacherLocation;

import mongoose from "mongoose";

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      validate: {
        validator(value) {
          return (
            Array.isArray(value) &&
            value.length === 2 &&
            value.every((item) => Number.isFinite(Number(item)))
          );
        },
        message: "Geo location must contain [longitude, latitude].",
      },
    },
  },
  { _id: false },
);

const teacherLocationSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Lesson meeting point",
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      default: "",
    },
    placeId: {
      type: String,
      trim: true,
      default: "",
    },

    // Kept for compatibility with your existing frontend and old bookings.
    coordinates: {
      lat: Number,
      lng: Number,
    },

    // Used by MongoDB $near / $geoNear queries.
    geoLocation: {
      type: geoPointSchema,
      default: undefined,
    },
    serviceRadiusKm: {
      type: Number,
      min: 1,
      max: 100,
      default: 10,
    },
    meetingType: {
      type: String,
      enum: ["teacher_location", "student_pickup", "both"],
      default: "teacher_location",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

teacherLocationSchema.pre("validate", function syncLocationFields() {
  const legacyLat = Number(this.coordinates?.lat);
  const legacyLng = Number(this.coordinates?.lng);
  const geoLng = Number(this.geoLocation?.coordinates?.[0]);
  const geoLat = Number(this.geoLocation?.coordinates?.[1]);

  if (Number.isFinite(legacyLat) && Number.isFinite(legacyLng)) {
    this.geoLocation = {
      type: "Point",
      coordinates: [legacyLng, legacyLat],
    };
  } else if (Number.isFinite(geoLat) && Number.isFinite(geoLng)) {
    this.coordinates = {
      lat: geoLat,
      lng: geoLng,
    };
  }
});

teacherLocationSchema.index({ geoLocation: "2dsphere" });
teacherLocationSchema.index({ teacher: 1, status: 1 });

const TeacherLocation = mongoose.model(
  "TeacherLocation",
  teacherLocationSchema,
);

export default TeacherLocation;
