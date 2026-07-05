import mongoose from "mongoose";

const teacherVehicleSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleName: { type: String, required: true },
    vehicleType: {
      type: String,
      enum: ["manual", "automatic"],
      required: true,
    },
    brand: String,
    model: String,
    registrationNumber: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

const TeacherVehicle = mongoose.model("TeacherVehicle", teacherVehicleSchema);
export default TeacherVehicle;
