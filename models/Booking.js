// import mongoose from "mongoose";

// const locationSnapshotSchema = new mongoose.Schema(
//   {
//     address: String,
//     city: String,
//     postalCode: String,
//     placeId: String,
//     lat: Number,
//     lng: Number,
//   },
//   { _id: false },
// );

// const bookingSchema = new mongoose.Schema(
//   {
//     student: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     teacher: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     offer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Offer",
//     },
//     teacherLocation: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "TeacherLocation",
//     },

//     // Existing field retained so old UI and records keep working.
//     location: {
//       type: locationSnapshotSchema,
//       default: undefined,
//     },
//     studentSearchLocation: {
//       type: locationSnapshotSchema,
//       default: undefined,
//     },
//     distanceKm: {
//       type: Number,
//       min: 0,
//     },
//     vehicleType: {
//       type: String,
//       enum: ["manual", "automatic"],
//       required: true,
//     },
//     bookingDate: {
//       type: Date,
//       required: true,
//     },
//     startTime: {
//       type: String,
//       required: true,
//     },
//     endTime: {
//       type: String,
//       required: true,
//     },
//     duration: {
//       type: Number,
//       required: true,
//       min: 30,
//       max: 240,
//     },
//     pricingSnapshot: {
//       hourlyRate: {
//         type: Number,
//         min: 0,
//         default: 0,
//       },
//       subtotal: {
//         type: Number,
//         min: 0,
//         default: 0,
//       },
//     },
//     status: {
//       type: String,
//       enum: [
//         "pending",
//         "confirmed",
//         "rejected",
//         "cancelled",
//         "completed",
//         "expired",
//       ],
//       default: "pending",
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["unpaid", "paid", "refunded"],
//       default: "unpaid",
//     },
//     cancellation: {
//       cancelledBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//       reason: String,
//       cancelledAt: Date,
//     },
//     rejection: {
//       rejectedBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//       reason: String,
//       rejectedAt: Date,
//     },
//   },
//   { timestamps: true },
// );

// bookingSchema.index({ student: 1, bookingDate: 1 });
// bookingSchema.index({ teacher: 1, bookingDate: 1, status: 1 });
// bookingSchema.index({ teacherLocation: 1, bookingDate: 1 });

// const Booking = mongoose.model("Booking", bookingSchema);

// export default Booking;

import mongoose from "mongoose";

const locationSnapshotSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    placeId: { type: String, trim: true, default: "" },
    lat: Number,
    lng: Number,
    meetingType: {
      type: String,
      enum: ["teacher_location", "student_pickup"],
      default: "teacher_location",
    },
  },
  { _id: false },
);

const vehicleSnapshotSchema = new mongoose.Schema(
  {
    vehicleName: { type: String, trim: true, default: "" },
    vehicleType: {
      type: String,
      enum: ["manual", "automatic", "electric"],
    },
    brand: { type: String, trim: true, default: "" },
    model: { type: String, trim: true, default: "" },
    modelYear: Number,
    registrationNumber: { type: String, trim: true, default: "" },
    vehicleImage: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      default: null,
    },
    teacherLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherLocation",
      default: null,
    },
    teacherVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherVehicle",
      default: null,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },

    // Snapshots preserve exactly what was selected even if the teacher later
    // edits a vehicle or location.
    location: {
      type: locationSnapshotSchema,
      required: true,
    },
    studentSearchLocation: {
      type: locationSnapshotSchema,
      default: undefined,
    },
    vehicleSnapshot: {
      type: vehicleSnapshotSchema,
      default: undefined,
    },

    distanceKm: { type: Number, min: 0 },
    vehicleType: {
      type: String,
      enum: ["manual", "automatic", "electric"],
      required: true,
      lowercase: true,
      trim: true,
    },
    bookingDate: { type: Date, required: true, index: true },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    duration: { type: Number, required: true, min: 30, max: 240 },

    pricingSnapshot: {
      hourlyRate: { type: Number, min: 0, default: 0 },
      subtotal: { type: Number, min: 0, default: 0 },
      currency: { type: String, trim: true, default: "EUR" },
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
        "no_show",
        "expired",
      ],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    expiresAt: { type: Date, default: null, index: true },

    confirmation: {
      confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      confirmedAt: Date,
    },
    rejection: {
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, trim: true, default: "" },
      rejectedAt: Date,
    },
    cancellation: {
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, trim: true, default: "" },
      cancelledAt: Date,
    },
  },
  { timestamps: true },
);

bookingSchema.index({ student: 1, bookingDate: -1, startTime: 1 });
bookingSchema.index({ teacher: 1, bookingDate: -1, startTime: 1 });
bookingSchema.index({ teacher: 1, status: 1, bookingDate: 1 });
bookingSchema.index({ teacherLocation: 1, bookingDate: 1 });
bookingSchema.index({ teacherVehicle: 1, bookingDate: 1 });
bookingSchema.index(
  { lesson: 1 },
  {
    unique: true,
    partialFilterExpression: { lesson: { $type: "objectId" } },
  },
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
