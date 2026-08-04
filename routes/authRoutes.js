import express from "express";
import {
  register,
  login,
  me,
  logout,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadProfileAvatar } from "../middlewares/profileUploadMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.post("/logout", logout);

router.patch("/profile", protect, uploadProfileAvatar, updateProfile);
router.patch("/change-password", protect, changePassword);

export default router;
