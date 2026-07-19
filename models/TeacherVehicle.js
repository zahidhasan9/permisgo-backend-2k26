// //

// import mongoose from "mongoose";

// const teacherVehicleSchema = new mongoose.Schema(
//   {
//     teacher: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     vehicleName: { type: String, required: true },
//     vehicleType: {
//       type: String,
//       enum: ["manual", "automatic"],
//       required: true,
//     },
//     brand: String,
//     model: String,
//     vehiclenumber: { type: String, required: true, unique: true },
//     status: { type: String, enum: ["active", "inactive"], default: "active" },
//     vehicleImage: String,
//   },
//   { timestamps: true },
// );

// const TeacherVehicle = mongoose.model("TeacherVehicle", teacherVehicleSchema);
// export default TeacherVehicle;

import mongoose from "mongoose";

const teacherVehicleSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicleName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    vehicleType: {
      type: String,
      enum: ["manual", "automatic", "electric"],
      required: true,
      lowercase: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    model: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    modelYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 1,
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 50,
      index: true,
    },
    vehicleImage: {
      type: String,
      default: "",
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true },
);

teacherVehicleSchema.index({ teacher: 1, createdAt: -1 });
teacherVehicleSchema.index({ teacher: 1, isDefault: 1 });

const TeacherVehicle = mongoose.model("TeacherVehicle", teacherVehicleSchema);

export default TeacherVehicle;
