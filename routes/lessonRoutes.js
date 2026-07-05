import express from "express";
import lessonController from "../controllers/lessonController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.use(protect);

router.get("/", lessonController.getLessons);
router.get("/:id", lessonController.getLesson);
router.patch(
  "/:id/start",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  lessonController.startLesson,
);
router.patch("/:id/attendance", lessonController.confirmAttendance);
router.patch(
  "/:id/complete",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  lessonController.completeLesson,
);

export default router;
