import express from "express";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { createContactSubmission, getContactSubmissions, updateContactStatus } from "../controllers/contactController.js";

const router = express.Router();
router.post("/", createContactSubmission);
router.get("/", protect, authorize("admin"), getContactSubmissions);
router.patch("/:id/status", protect, authorize("admin"), updateContactStatus);
export default router;
