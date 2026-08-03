import express from "express";
import faqController from "../controllers/faqController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", faqController.getFaqs);
router.get("/admin/all", protect, authorize("admin"), faqController.getAdminFaqs);
router.post("/", protect, authorize("admin"), faqController.createFaq);
router.patch("/:id", protect, authorize("admin"), faqController.updateFaq);
router.delete("/:id", protect, authorize("admin"), faqController.deleteFaq);

export default router;
