import express from "express";
import bookingController from "../controllers/bookingController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.use(protect);

router.post("/", authorize(ROLES.STUDENT), bookingController.createBooking);
router.get("/", bookingController.getBookings);
router.get("/:id", bookingController.getBooking);
router.patch(
  "/:id/confirm",
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  bookingController.confirmBooking,
);
router.patch("/:id/cancel", bookingController.cancelBooking);

export default router;
