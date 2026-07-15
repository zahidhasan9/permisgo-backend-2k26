// // import express from "express";

// // import {
// //   completeLesson,
// //   confirmAttendance,
// //   getLesson,
// //   getLessons,
// //   startLesson,
// // } from "../controllers/lessonController.js";

// // import { authorize, protect } from "../middlewares/authMiddleware.js";

// // const router = express.Router();

// // /**
// //  * নিচের সব route ব্যবহার করতে login করা থাকতে হবে।
// //  */
// // router.use(protect);

// // /**
// //  * GET /api/lessons
// //  *
// //  * Student নিজের lesson দেখবে।
// //  * Teacher নিজের assigned lesson দেখবে।
// //  * Admin সব lesson দেখবে।
// //  */
// // router.get("/", authorize("student", "teacher", "admin"), getLessons);

// // /**
// //  * GET /api/lessons/:id
// //  */
// // router.get("/:id", authorize("student", "teacher", "admin"), getLesson);

// // /**
// //  * PATCH /api/lessons/:id/start
// //  */
// // router.patch("/:id/start", authorize("teacher", "admin"), startLesson);

// // /**
// //  * PATCH /api/lessons/:id/attendance
// //  */
// // router.patch(
// //   "/:id/attendance",
// //   authorize("student", "teacher", "admin"),
// //   confirmAttendance,
// // );

// // router.patch("/:id/complete", authorize("teacher", "admin"), completeLesson);

// // export default router;

// import express from "express";

// import {
//   cancelLesson,
//   completeLesson,
//   confirmAttendance,
//   createLesson,
//   getLesson,
//   getLessons,
//   startLesson,
//   updateLesson,
// } from "../controllers/lessonController.js";

// import { authorize, protect } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// router.use(protect);

// /**
//  * Admin, student এবং teacher lesson list দেখতে পারবে।
//  * Controller role অনুযায়ী data filter করবে।
//  */
// router.get("/", authorize("student", "teacher", "admin"), getLessons);

// /**
//  * Admin নতুন lesson schedule করবে।
//  */
// router.post("/", authorize("admin"), createLesson);

// /**
//  * Single lesson।
//  */
// router.get("/:id", authorize("student", "teacher", "admin"), getLesson);

// /**
//  * Admin lesson schedule update করবে।
//  */
// router.patch("/:id", authorize("admin"), updateLesson);

// /**
//  * Teacher অথবা admin lesson start করবে।
//  */
// router.patch("/:id/start", authorize("teacher", "admin"), startLesson);

// /**
//  * Student, teacher অথবা admin attendance confirm করবে।
//  */
// router.patch(
//   "/:id/attendance",
//   authorize("student", "teacher", "admin"),
//   confirmAttendance,
// );

// /**
//  * Teacher অথবা admin lesson complete করবে।
//  */
// router.patch("/:id/complete", authorize("teacher", "admin"), completeLesson);

// /**
//  * শুধু admin lesson cancel করবে।
//  */
// router.patch("/:id/cancel", authorize("admin"), cancelLesson);

// export default router;

import express from "express";
import {
  cancelLesson,
  completeLesson,
  confirmAttendance,
  confirmLessonCompletion,
  createLesson,
  getLesson,
  getLessons,
  getLessonStats,
  markNoShow,
  requestCancellation,
  requestReschedule,
  resolveCancellation,
  resolveReschedule,
  startLesson,
  submitLessonFeedback,
  updateLesson,
} from "../controllers/lessonController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Keep fixed routes before /:id.
router.get("/stats", authorize("student", "teacher", "admin"), getLessonStats);

router.get("/", authorize("student", "teacher", "admin"), getLessons);
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
