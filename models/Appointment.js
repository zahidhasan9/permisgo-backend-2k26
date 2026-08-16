import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    courseTitle: { type: String, required: true, trim: true, maxlength: 180 },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    instructorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    appointmentDate: { type: Date, required: true, index: true },
    appointmentTime: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    duration: { type: Number, required: true, enum: [30, 60, 120] },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

appointmentSchema.index({ createdAt: -1 });

export default mongoose.model("Appointment", appointmentSchema);
