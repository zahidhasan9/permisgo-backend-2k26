import mongoose from "mongoose";

const teacherLocationSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    address: { type: String, required: true },
    city: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

teacherLocationSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });

const TeacherLocation = mongoose.model(
  "TeacherLocation",
  teacherLocationSchema,
);
export default TeacherLocation;
