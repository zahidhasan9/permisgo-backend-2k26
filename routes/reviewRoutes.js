import express from "express";
import reviewController from "../controllers/reviewController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.get("/teacher/:teacherId", reviewController.getTeacherReviews);
router.post(
  "/",
  protect,
  authorize(ROLES.STUDENT),
  reviewController.createReview,
);

export default router;
