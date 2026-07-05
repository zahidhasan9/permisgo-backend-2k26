import express from "express";
import examController from "../controllers/examController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.use(protect);
router.post("/", authorize(ROLES.STUDENT), examController.createExamRequest);
router.get("/me", authorize(ROLES.STUDENT), examController.getMyExams);
router.patch("/:id", authorize(ROLES.ADMIN), examController.updateExam);

export default router;
