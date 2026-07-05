import express from "express";
import referralController from "../controllers/referralController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(protect);
router.get("/me", referralController.getMyReferral);

export default router;
