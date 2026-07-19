// import mongoose from "mongoose";

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
//     offer: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" },
//     location: {
//       address: String,
//       city: String,
//       lat: Number,
//       lng: Number,
//     },
//     vehicleType: {
//       type: String,
//       enum: ["manual", "automatic"],
//       required: true,
//     },
//     bookingDate: { type: Date, required: true },
//     startTime: { type: String, required: true },
//     endTime: { type: String, required: true },
//     duration: { type: Number, required: true },
//     status: {
//       type: String,
//       enum: ["pending", "confirmed", "cancelled", "completed"],
//       default: "pending",
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["unpaid", "paid", "refunded"],
//       default: "unpaid",
//     },
//     cancellation: {
//       cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//       reason: String,
//       cancelledAt: Date,
//     },
//   },
//   { timestamps: true },
// );

// bookingSchema.index({ student: 1, bookingDate: 1 });
// bookingSchema.index({ teacher: 1, bookingDate: 1 });

// const Booking = mongoose.model("Booking", bookingSchema);
// export default Booking;
import mongoose from "mongoose";

const locationSnapshotSchema = new mongoose.Schema(
  {
    address: String,
    city: String,
    postalCode: String,
    placeId: String,
    lat: Number,
    lng: Number,
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
    },
    teacherLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherLocation",
    },

    // Existing field retained so old UI and records keep working.
    location: {
      type: locationSnapshotSchema,
      default: undefined,
    },
    studentSearchLocation: {
      type: locationSnapshotSchema,
      default: undefined,
    },
    distanceKm: {
      type: Number,
      min: 0,
    },
    vehicleType: {
      type: String,
      enum: ["manual", "automatic"],
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 30,
      max: 240,
    },
    pricingSnapshot: {
      hourlyRate: {
        type: Number,
        min: 0,
        default: 0,
      },
      subtotal: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "rejected",
        "cancelled",
        "completed",
        "expired",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      cancelledAt: Date,
    },
    rejection: {
      rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      rejectedAt: Date,
    },
  },
  { timestamps: true },
);

bookingSchema.index({ student: 1, bookingDate: 1 });
bookingSchema.index({ teacher: 1, bookingDate: 1, status: 1 });
bookingSchema.index({ teacherLocation: 1, bookingDate: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
