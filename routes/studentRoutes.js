import express from "express";
import studentController from "../controllers/studentController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.use(protect, authorize(ROLES.STUDENT));

router.get("/dashboard", studentController.getDashboard);
router.get("/profile", studentController.getProfile);
router.patch("/profile", studentController.updateProfile);
router.patch(
  "/favorite-teachers/:teacherId",
  studentController.addFavoriteTeacher,
);
router.delete(
  "/favorite-teachers/:teacherId",
  studentController.removeFavoriteTeacher,
);

export default router;
