import express from "express";
import { getTeacherReviews } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/teacher/:teacherId", getTeacherReviews);

export default router;
