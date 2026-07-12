// import express from "express";
// import bookingController from "../controllers/bookingController";
// import { protect, authorize } from "../middlewares/authMiddleware";
// import ROLES from "../constants/roles";

// const router = express.Router();

// router.use(protect);

// router.post("/", authorize(ROLES.STUDENT), bookingController.createBooking);
// router.get("/", bookingController.getBookings);
// router.get("/:id", bookingController.getBooking);
// router.patch(
//   "/:id/confirm",
//   authorize(ROLES.TEACHER, ROLES.ADMIN),
//   bookingController.confirmBooking,
// );
// router.patch("/:id/cancel", bookingController.cancelBooking);

// export default router;

import express from "express";

import {
  cancelBooking,
  confirmBooking,
  createBooking,
  getBooking,
  getBookings,
  getTeacherAvailability,
} from "../controllers/bookingController.js";

import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

/**
 * Student selected teacher-এর occupied time দেখবে।
 */
router.get(
  "/availability",
  authorize("student", "teacher", "admin"),
  getTeacherAvailability,
);

router.post("/", authorize("student"), createBooking);
router.get("/", authorize("student", "teacher", "admin"), getBookings);

router.get("/:id", authorize("student", "teacher", "admin"), getBooking);
router.patch("/:id/confirm", authorize("teacher", "admin"), confirmBooking);

router.patch(
  "/:id/cancel",
  authorize("student", "teacher", "admin"),
  cancelBooking,
);

export default router;
