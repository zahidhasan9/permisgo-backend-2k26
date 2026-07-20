import mongoose from "mongoose";

const teacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: { type: String, trim: true, maxlength: 500, default: "" },
    experienceYears: { type: Number, min: 0, max: 80, default: 0 },
    qualification: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    lessonTypes: [
      {
        type: String,
        enum: ["manual", "automatic", "code", "accompanied", "accelerated"],
      },
    ],
    hourlyRate: { type: Number, min: 0, max: 10000, default: 0 },
    rating: {
      average: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
    vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: "TeacherVehicle" }],
    locations: [
      { type: mongoose.Schema.Types.ObjectId, ref: "TeacherLocation" },
    ],
  },
  { timestamps: true },
);

const TeacherProfile = mongoose.model("TeacherProfile", teacherProfileSchema);
export default TeacherProfile;
