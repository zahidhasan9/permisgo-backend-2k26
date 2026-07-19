// import express from "express";

// import {
//   cancelBooking,
//   confirmBooking,
//   createBooking,
//   getBooking,
//   getBookings,
//   getTeacherAvailability,
// } from "../controllers/bookingController.js";

// import { authorize, protect } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// router.use(protect);

// /**
//  * Student selected teacher-এর occupied time দেখবে।
//  */
// router.get(
//   "/availability",
//   authorize("student", "teacher", "admin"),
//   getTeacherAvailability,
// );

// router.post("/", authorize("student"), createBooking);
// router.get("/", authorize("student", "teacher", "admin"), getBookings);

// router.get("/:id", authorize("student", "teacher", "admin"), getBooking);
// router.patch("/:id/confirm", authorize("teacher", "admin"), confirmBooking);

// router.patch(
//   "/:id/cancel",
//   authorize("student", "teacher", "admin"),
//   cancelBooking,
// );

// export default router;

import express from "express";
import {
  cancelBooking,
  confirmBooking,
  createBooking,
  getAvailableSlots,
  getBooking,
  getBookings,
  getTeacherAvailability,
  rejectBooking,
} from "../controllers/bookingController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get(
  "/availability",
  authorize("student", "teacher", "admin"),
  getTeacherAvailability,
);
router.get(
  "/available-slots",
  authorize("student", "teacher", "admin"),
  getAvailableSlots,
);

router.post("/", authorize("student"), createBooking);
router.get("/", authorize("student", "teacher", "admin"), getBookings);
router.get("/:id", authorize("student", "teacher", "admin"), getBooking);
router.patch("/:id/confirm", authorize("teacher", "admin"), confirmBooking);
router.patch("/:id/reject", authorize("teacher", "admin"), rejectBooking);
router.patch(
  "/:id/cancel",
  authorize("student", "teacher", "admin"),
  cancelBooking,
);

export default router;
