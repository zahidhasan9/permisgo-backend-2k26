import express from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import {
  createExamQuestion,
  deleteExamQuestion,
  getAdminExamQuestionById,
  getAdminExamQuestions,
  getStudentExamQuestions,
  updateExamQuestion,
} from "../controllers/examQuestionController.js";

const router = express.Router();
router.get(
  "/",
  protect,
  authorize("student", "admin"),
  getStudentExamQuestions,
);
router.get("/admin", protect, authorize("admin"), getAdminExamQuestions);
router.get("/admin/:id", protect, authorize("admin"), getAdminExamQuestionById);
router.post("/", protect, authorize("admin"), upload.any(), createExamQuestion);
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  upload.any(),
  updateExamQuestion,
);
router.delete("/:id", protect, authorize("admin"), deleteExamQuestion);
export default router;
