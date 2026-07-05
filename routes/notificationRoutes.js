import express from "express";
import notificationController from "../controllers/notificationController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(protect);
router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);

export default router;
