import express from "express";
import {
  createLearningContent,
  getAdminLearningContents,
  updateLearningContent,
  deleteLearningContent,
  permanentlyDeleteLearningContent,
  getLearningContents,
  getLearningContentById,
  downloadLearningContentFile,
  updateLearningProgress,
  toggleLearningFavorite,
  getLearningSummary,
  uploadLearningEditorImage,
} from "../controllers/learningContentController.js";

import { protect, authorize } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/admin/editor-image",
  protect,
  authorize("admin"),
  upload.single("upload"),
  uploadLearningEditorImage,
);

// Admin routes
router.post(
  "/admin/contents",
  protect,
  authorize("admin"),
  upload.any(),
  createLearningContent,
);

router.get(
  "/admin/contents",
  protect,
  authorize("admin"),
  getAdminLearningContents,
);

router.patch(
  "/admin/contents/:id",
  protect,
  authorize("admin"),
  upload.any(),
  updateLearningContent,
);

router.delete(
  "/admin/contents/:id",
  protect,
  authorize("admin"),
  deleteLearningContent,
);

// Student routes
router.get(
  "/contents",
  protect,
  authorize("student", "admin"),
  getLearningContents,
);

router.delete(
  "/admin/contents/:id/permanent",
  protect,
  authorize("admin"),
  permanentlyDeleteLearningContent,
);

router.get(
  "/contents/:id/download",
  protect,
  authorize("student", "admin"),
  downloadLearningContentFile,
);

router.get(
  "/contents/:id",
  protect,
  authorize("student", "admin"),
  getLearningContentById,
);

router.get(
  "/summary",
  protect,
  authorize("student", "admin"),
  getLearningSummary,
);

router.post(
  "/contents/:id/progress",
  protect,
  authorize("student", "admin"),
  updateLearningProgress,
);

router.patch(
  "/contents/:id/favorite",
  protect,
  authorize("student", "admin"),
  toggleLearningFavorite,
);

export default router;
