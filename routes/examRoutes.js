import express from "express";
import { createExamRequest, getMyExams, updateExam } from "../controllers/examController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", authorize("student"), createExamRequest);
router.get("/me", authorize("student"), getMyExams);
router.patch("/:id", authorize("admin"), updateExam);

export default router;
