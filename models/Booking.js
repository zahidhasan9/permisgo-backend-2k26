import mongoose from "mongoose";

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
    offer: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" },
    location: {
      address: String,
      city: String,
      lat: Number,
      lng: Number,
    },
    vehicleType: {
      type: String,
      enum: ["manual", "automatic"],
      required: true,
    },
    bookingDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    cancellation: {
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: String,
      cancelledAt: Date,
    },
  },
  { timestamps: true },
);

bookingSchema.index({ student: 1, bookingDate: 1 });
bookingSchema.index({ teacher: 1, bookingDate: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
