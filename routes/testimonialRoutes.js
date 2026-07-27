import express from "express";
import testimonialController from "../controllers/testimonialController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.get("/", testimonialController.getTestimonials);
router.post(
  "/",
  protect,
  authorize(ROLES.ADMIN),
  testimonialController.createTestimonial,
);
router.patch(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  testimonialController.updateTestimonial,
);
router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  testimonialController.deleteTestimonial,
);

export default router;
