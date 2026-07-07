import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getDashboard,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  verifyTeacher,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

router.patch("/teachers/:teacherId/verify", verifyTeacher);

export default router;
