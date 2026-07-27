// import express from "express";
// import {
//   getDashboard,
//   getProfile,
//   getPublicTeachers,
//   updateProfile,
// } from "../controllers/teacherController.js";
// import {
//   getMyAvailability,
//   updateMyAvailability,
// } from "../controllers/teacherAvailabilityController.js";
// import {
//   createMyLocation,
//   deleteMyLocation,
//   getMyLocations,
//   getNearbyTeachers,
//   updateMyLocation,
// } from "../controllers/teacherLocationController.js";
// import {
//   addTeacherVehicle,
//   getMyTeacherVehicleById,
//   getMyTeacherVehicles,
//   updateMyTeacherVehicle,
// } from "../controllers/teacherVehicleController.js";
// import { authorize, protect } from "../middlewares/authMiddleware.js";
// import upload from "../middlewares/uploadMiddleware.js";

// const router = express.Router();

// // Public teacher directory used by existing screens.
// router.get("/public", getPublicTeachers);

// // Location-based search used by the student booking page.
// router.get(
//   "/nearby",
//   protect,
//   authorize("student", "teacher", "admin"),
//   getNearbyTeachers,
// );

// // All routes below are for the logged-in teacher.
// router.use(protect, authorize("teacher"));

// router.get("/dashboard", getDashboard);
// router.get("/profile", getProfile);
// router.patch("/profile", updateProfile);

// router.post("/vehicles", upload.single("vehicleImage"), addTeacherVehicle);
// router.get("/vehicles", getMyTeacherVehicles);
// router.get("/vehicles/my", getMyTeacherVehicles);
// router.get("/vehicles/:id", getMyTeacherVehicleById);
// router.patch(
//   "/vehicles/:id",
//   upload.single("vehicleImage"),
//   updateMyTeacherVehicle,
// );

// router.get("/locations", getMyLocations);
// router.post("/locations", createMyLocation);
// router.patch("/locations/:id", updateMyLocation);
// router.delete("/locations/:id", deleteMyLocation);

// router.get("/availability", getMyAvailability);
// router.put("/availability", updateMyAvailability);

// export default router;

import express from "express";

import {
  getDashboard,
  getMyStudentDetails,
  getMyStudents,
  getProfile,
  getPublicTeachers,
  updateProfile,
} from "../controllers/teacherController.js";

import {
  getMyAvailability,
  updateMyAvailability,
} from "../controllers/teacherAvailabilityController.js";

import {
  createMyLocation,
  deleteMyLocation,
  getMyLocations,
  getNearbyTeachers,
  updateMyLocation,
} from "../controllers/teacherLocationController.js";

import {
  addTeacherVehicle,
  getMyTeacherVehicleById,
  getMyTeacherVehicles,
  updateMyTeacherVehicle,
} from "../controllers/teacherVehicleController.js";

import { authorize, protect } from "../middlewares/authMiddleware.js";

import vehicleUpload from "../middlewares/vehicleUploadMiddleware.js";

const router = express.Router();

// Public teacher directory used by existing screens.
router.get("/public", getPublicTeachers);

// Location-based search used by the student booking page.
router.get(
  "/nearby",
  protect,
  authorize("student", "teacher", "admin"),
  getNearbyTeachers,
);

// All routes below are for the logged-in teacher.
router.use(protect, authorize("teacher"));

router.get("/dashboard", getDashboard);
router.get("/students", getMyStudents);
router.get("/students/:studentId", getMyStudentDetails);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

router.post(
  "/vehicles",
  vehicleUpload.single("vehicleImage"),
  addTeacherVehicle,
);

router.get("/vehicles", getMyTeacherVehicles);
router.get("/vehicles/my", getMyTeacherVehicles);
router.get("/vehicles/:id", getMyTeacherVehicleById);

router.patch(
  "/vehicles/:id",
  vehicleUpload.single("vehicleImage"),
  updateMyTeacherVehicle,
);

router.get("/locations", getMyLocations);
router.post("/locations", createMyLocation);
router.patch("/locations/:id", updateMyLocation);
router.delete("/locations/:id", deleteMyLocation);

router.get("/availability", getMyAvailability);
router.put("/availability", updateMyAvailability);

export default router;
