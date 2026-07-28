import express from "express";
import { getMyReferral } from "../controllers/referralController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/me", getMyReferral);

export default router;
