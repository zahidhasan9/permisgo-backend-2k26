import express from "express";
import {
  getQuizzes,
  getQuiz,
  getQuestions,
  startQuizAttempt,
  submitQuizAnswer,
  finishQuizAttempt,
  getMyQuizAttempts,
  getQuizAttemptReview,
  getAdminQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getAdminQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAdminAttempts,
  getRoadSigns,
  createRoadSign,
} from "../controllers/quizController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Existing public road sign feature
router.get("/road-signs/list", getRoadSigns);
router.post(
  "/road-signs",
  protect,
  authorize("admin"),
  upload.any(),
  createRoadSign,
);

// Admin quiz management
router.get("/admin/all", protect, authorize("admin"), getAdminQuizzes);
router.get("/admin/attempts", protect, authorize("admin"), getAdminAttempts);
router.post("/", protect, authorize("admin"), upload.any(), createQuiz);
router.patch("/:quizId", protect, authorize("admin"), upload.any(), updateQuiz);
router.delete("/:quizId", protect, authorize("admin"), deleteQuiz);

// Admin question management
router.get(
  "/:quizId/admin-questions",
  protect,
  authorize("admin"),
  getAdminQuestions,
);
router.post(
  "/:quizId/questions",
  protect,
  authorize("admin"),
  upload.any(),
  createQuestion,
);
router.get(
  "/questions/:questionId",
  protect,
  authorize("admin"),
  getQuestionById,
);
router.patch(
  "/questions/:questionId",
  protect,
  authorize("admin"),
  upload.any(),
  updateQuestion,
);
router.delete(
  "/questions/:questionId",
  protect,
  authorize("admin"),
  deleteQuestion,
);

// Student attempt / history / review
router.get(
  "/attempts/me",
  protect,
  authorize("student", "admin"),
  getMyQuizAttempts,
);
router.get(
  "/attempts/:attemptId/review",
  protect,
  authorize("student", "admin"),
  getQuizAttemptReview,
);
router.post(
  "/attempts/:attemptId/answer",
  protect,
  authorize("student", "admin"),
  submitQuizAnswer,
);
router.post(
  "/attempts/:attemptId/finish",
  protect,
  authorize("student", "admin"),
  finishQuizAttempt,
);
router.post(
  "/:quizId/attempts/start",
  protect,
  authorize("student", "admin"),
  startQuizAttempt,
);

// Public / student quiz read
router.get("/", getQuizzes);
router.get("/:quizId", getQuiz);
router.get(
  "/:quizId/questions",
  protect,
  authorize("student", "admin"),
  getQuestions,
);

export default router;
