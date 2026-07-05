import express from "express";
import quizController from "../controllers/quizController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.get("/", quizController.getQuizzes);
router.get("/:quizId/questions", quizController.getQuestions);
router.get("/road-signs/list", quizController.getRoadSigns);

router.post("/", protect, authorize(ROLES.ADMIN), quizController.createQuiz);
router.post(
  "/questions",
  protect,
  authorize(ROLES.ADMIN),
  quizController.createQuestion,
);
router.post(
  "/road-signs",
  protect,
  authorize(ROLES.ADMIN),
  quizController.createRoadSign,
);

export default router;
