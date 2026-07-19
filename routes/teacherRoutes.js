// import express from "express";

// import {
//   addLocation,
//   addVehicle,
//   deleteVehicle,
//   getAllVehicles,
//   getDashboard,
//   getLocations,
//   getMyVehicles,
//   getProfile,
//   getPublicTeachers,
//   getVehicleById,
//   getVehiclesByTeacher,
//   updateProfile,
//   updateVehicle,
// } from "../controllers/teacherController.js";

// import { authorize, protect } from "../middlewares/authMiddleware.js";
// import upload from "../middlewares/uploadMiddleware.js";

// const router = express.Router();

// router.get("/public", getPublicTeachers);

// /**
//  * below routes only teacher use
//  */
// router.use(protect, authorize("teacher"));

// router.get("/dashboard", getDashboard);

// router.get("/profile", getProfile);

// router.patch("/profile", updateProfile);

// // router.get("/vehicles", getVehicles);

// // router.post("/vehicles", addVehicle);

// router.post("/vehicles", protect, upload.single("vehicleImage"), addVehicle);

// router.get("/vehicles/my", protect, getMyVehicles);

// router.get("/vehicles/all", protect, getAllVehicles);

// router.get("/vehicles/teacher/:teacherId", protect, getVehiclesByTeacher);

// router.get("/vehicles/:id", protect, getVehicleById);

// router.patch(
//   "/vehicles/:id",
//   protect,
//   upload.single("vehicleImage"),
//   updateVehicle,
// );

// router.delete("/vehicles/:id", protect, deleteVehicle);

// router.get("/locations", getLocations);

// router.post("/locations", addLocation);

// export default router;

import express from "express";
import {
  addLocation,
  getDashboard,
  getLocations,
  getProfile,
  getPublicTeachers,
  updateProfile,
} from "../controllers/teacherController.js";
import {
  addTeacherVehicle,
  getMyTeacherVehicleById,
  getMyTeacherVehicles,
  updateMyTeacherVehicle,
} from "../controllers/teacherVehicleController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/public", getPublicTeachers);

router.use(protect, authorize("teacher"));

router.get("/dashboard", getDashboard);
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

router.post("/vehicles", upload.single("vehicleImage"), addTeacherVehicle);
router.get("/vehicles", getMyTeacherVehicles);
router.get("/vehicles/my", getMyTeacherVehicles);
router.get("/vehicles/:id", getMyTeacherVehicleById);
router.patch(
  "/vehicles/:id",
  upload.single("vehicleImage"),
  updateMyTeacherVehicle,
);

router.get("/locations", getLocations);
router.post("/locations", addLocation);

export default router;
