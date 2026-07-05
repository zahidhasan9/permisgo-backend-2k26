import express from "express";
import documentController from "../controllers/documentController";
import upload from "../middlewares/uploadMiddleware";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.use(protect);

router.post("/", upload.single("file"), documentController.uploadDocument);
router.get("/", documentController.getDocuments);
router.patch(
  "/:id/review",
  authorize(ROLES.ADMIN),
  documentController.reviewDocument,
);

export default router;
