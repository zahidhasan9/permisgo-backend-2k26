// import express from "express";
// import {
//   cancelLesson,
//   completeLesson,
//   confirmAttendance,
//   confirmLessonCompletion,
//   createLesson,
//   getLesson,
//   getLessons,
//   getLessonStats,
//   markNoShow,
//   requestCancellation,
//   requestReschedule,
//   resolveCancellation,
//   resolveReschedule,
//   startLesson,
//   submitLessonFeedback,
//   updateLesson,
// } from "../controllers/lessonController.js";
// import { authorize, protect } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// router.use(protect);

// // Keep fixed routes before /:id.
// router.get("/stats", authorize("student", "teacher", "admin"), getLessonStats);

// router.get("/", authorize("student", "teacher", "admin"), getLessons);
// router.post("/", authorize("admin"), createLesson);

// router.get("/:id", authorize("student", "teacher", "admin"), getLesson);
// router.patch("/:id", authorize("admin"), updateLesson);
// router.patch("/:id/start", authorize("teacher", "admin"), startLesson);
// router.patch(
//   "/:id/attendance",
//   authorize("student", "teacher", "admin"),
//   confirmAttendance,
// );
// router.patch("/:id/complete", authorize("teacher", "admin"), completeLesson);
// router.patch(
//   "/:id/confirm-completion",
//   authorize("student", "admin"),
//   confirmLessonCompletion,
// );
// router.patch("/:id/feedback", authorize("student"), submitLessonFeedback);
// router.post(
//   "/:id/reschedule-request",
//   authorize("student", "teacher"),
//   requestReschedule,
// );
// router.patch("/:id/resolve-reschedule", authorize("admin"), resolveReschedule);
// router.post(
//   "/:id/cancel-request",
//   authorize("student", "teacher"),
//   requestCancellation,
// );
// router.patch(
//   "/:id/resolve-cancellation",
//   authorize("admin"),
//   resolveCancellation,
// );
// router.patch("/:id/cancel", authorize("admin"), cancelLesson);
// router.patch("/:id/no-show", authorize("teacher", "admin"), markNoShow);

// export default router;

import express from "express";

import {
  cancelLesson,
  completeLesson,
  confirmAttendance,
  confirmLessonCompletion,
  createLesson,
  getLesson,
  markNoShow,
  requestCancellation,
  requestReschedule,
  resolveCancellation,
  resolveReschedule,
  startLesson,
  submitLessonFeedback,
  updateLesson,
} from "../controllers/lessonController.js";

import {
  getLessonsPaginated,
  getLessonStatsPaginated,
} from "../controllers/lessonQueryController.js";

import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Fixed routes must stay before /:id.
router.get(
  "/stats",
  authorize("student", "teacher", "admin"),
  getLessonStatsPaginated,
);

router.get("/", authorize("student", "teacher", "admin"), getLessonsPaginated);

router.post("/", authorize("admin"), createLesson);

router.get("/:id", authorize("student", "teacher", "admin"), getLesson);

router.patch("/:id", authorize("admin"), updateLesson);

router.patch("/:id/start", authorize("teacher", "admin"), startLesson);

router.patch(
  "/:id/attendance",
  authorize("student", "teacher", "admin"),
  confirmAttendance,
);

router.patch("/:id/complete", authorize("teacher", "admin"), completeLesson);

router.patch(
  "/:id/confirm-completion",
  authorize("student", "admin"),
  confirmLessonCompletion,
);

router.patch("/:id/feedback", authorize("student"), submitLessonFeedback);

router.post(
  "/:id/reschedule-request",
  authorize("student", "teacher"),
  requestReschedule,
);

router.patch("/:id/resolve-reschedule", authorize("admin"), resolveReschedule);

router.post(
  "/:id/cancel-request",
  authorize("student", "teacher"),
  requestCancellation,
);

router.patch(
  "/:id/resolve-cancellation",
  authorize("admin"),
  resolveCancellation,
);

router.patch("/:id/cancel", authorize("admin"), cancelLesson);

router.patch("/:id/no-show", authorize("teacher", "admin"), markNoShow);

export default router;
