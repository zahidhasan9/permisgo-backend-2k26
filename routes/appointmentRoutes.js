import express from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";

const router = express.Router();
router.post("/", createAppointment);
router.get("/", protect, authorize("admin"), getAppointments);
router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  updateAppointmentStatus,
);

export default router;
