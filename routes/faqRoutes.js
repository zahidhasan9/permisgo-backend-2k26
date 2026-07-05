import express from "express";
import faqController from "../controllers/faqController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.get("/", faqController.getFaqs);
router.post("/", protect, authorize(ROLES.ADMIN), faqController.createFaq);
router.patch("/:id", protect, authorize(ROLES.ADMIN), faqController.updateFaq);
router.delete("/:id", protect, authorize(ROLES.ADMIN), faqController.deleteFaq);

export default router;
