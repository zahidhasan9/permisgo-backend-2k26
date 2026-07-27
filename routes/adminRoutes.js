// import express from "express";
// import { protect, authorize } from "../middlewares/authMiddleware.js";
// import {
//   getDashboard,
//   getUsers,
//   getUserById,
//   updateUserStatus,
//   updateUserRole,
//   deleteUser,
//   verifyTeacher,
// } from "../controllers/adminController.js";

// const router = express.Router();

// router.use(protect, authorize("admin"));

// router.get("/dashboard", getDashboard);

// router.get("/users", getUsers);
// router.get("/users/:id", getUserById);
// router.patch("/users/:id/status", updateUserStatus);
// router.patch("/users/:id/role", updateUserRole);
// router.delete("/users/:id", deleteUser);

// router.patch("/teachers/:teacherId/verify", verifyTeacher);

// export default router;

import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  deleteUser,
  getDashboard,
  getUserById,
  getUsers,
  updateUserRole,
  updateUserStatus,
  verifyTeacher,
} from "../controllers/adminController.js";
import {
  deleteTeacherVehicleByAdmin,
  getAdminTeacherVehicleById,
  getAdminTeacherVehicles,
  updateTeacherVehicleApproval,
} from "../controllers/adminVehicleController.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

router.patch("/teachers/:teacherId/verify", verifyTeacher);

router.get("/teacher-vehicles", getAdminTeacherVehicles);
router.get("/teacher-vehicles/:id", getAdminTeacherVehicleById);
router.patch("/teacher-vehicles/:id/approval", updateTeacherVehicleApproval);
router.delete("/teacher-vehicles/:id", deleteTeacherVehicleByAdmin);

export default router;
