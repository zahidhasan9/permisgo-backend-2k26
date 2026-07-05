import express from "express";
import adminController from "../controllers/adminController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN));

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.getUsers);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.patch("/teachers/:teacherId/verify", adminController.verifyTeacher);

export default router;
