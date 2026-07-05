import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dateOfBirth: Date,
    gender: String,
    address: String,
    city: String,
    postalCode: String,
    drivingInfo: {
      licenseType: String,
      currentLevel: String,
      preferredVehicleType: { type: String, enum: ["manual", "automatic"] },
      previousExperience: String,
    },
    progress: {
      totalLessons: { type: Number, default: 0 },
      completedLessons: { type: Number, default: 0 },
      remainingLessons: { type: Number, default: 0 },
      codeProgress: { type: Number, default: 0 },
      drivingProgress: { type: Number, default: 0 },
    },
    favoriteTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;
