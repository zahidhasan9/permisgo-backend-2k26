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
import {
  listCourses, createCourse, updateCourse, deleteCourse,
  listTopics, createTopic, updateTopic, deleteTopic,
} from "../controllers/ebookStructureController.js";
import {
  listAdminLessons, getAdminLesson, createLesson, updateLesson, deleteLesson, permanentlyDeleteLesson,
  listStudentLessons, listAllStudentLessons, getStudentLesson, updateStudentLessonProgress,
} from "../controllers/ebookLessonController.js";

const router = express.Router();

router.get("/ebook/courses", protect, authorize("student", "admin"), listCourses);
router.get("/ebook/courses/:courseId/topics", protect, authorize("student", "admin"), listTopics);
router.post("/admin/ebook/courses", protect, authorize("admin"), upload.any(), createCourse);
router.patch("/admin/ebook/courses/:courseId", protect, authorize("admin"), upload.any(), updateCourse);
router.delete("/admin/ebook/courses/:courseId", protect, authorize("admin"), deleteCourse);
router.post("/admin/ebook/courses/:courseId/topics", protect, authorize("admin"), createTopic);
router.patch("/admin/ebook/topics/:topicId", protect, authorize("admin"), updateTopic);
router.delete("/admin/ebook/topics/:topicId", protect, authorize("admin"), deleteTopic);
router.get("/admin/ebook/lessons", protect, authorize("admin"), listAdminLessons);
router.get("/admin/ebook/lessons/:lessonId", protect, authorize("admin"), getAdminLesson);
router.post("/admin/ebook/lessons", protect, authorize("admin"), upload.any(), createLesson);
router.patch("/admin/ebook/lessons/:lessonId", protect, authorize("admin"), upload.any(), updateLesson);
router.delete("/admin/ebook/lessons/:lessonId/permanent", protect, authorize("admin"), permanentlyDeleteLesson);
router.delete("/admin/ebook/lessons/:lessonId", protect, authorize("admin"), deleteLesson);
router.get("/ebook/courses/:courseId/topics/:topicId/lessons", protect, authorize("student", "admin"), listStudentLessons);
router.get("/ebook/lessons", protect, authorize("student", "admin"), listAllStudentLessons);
router.get("/ebook/lessons/:lessonId", protect, authorize("student", "admin"), getStudentLesson);
router.patch("/ebook/lessons/:lessonId/progress", protect, authorize("student", "admin"), updateStudentLessonProgress);

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
