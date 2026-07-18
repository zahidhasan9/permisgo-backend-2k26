// import express from "express";
// import studentController from "../controllers/studentController";
// import { protect, authorize } from "../middlewares/authMiddleware";
// import ROLES from "../constants/roles";

// const router = express.Router();

// router.use(protect, authorize(ROLES.STUDENT));

// router.get("/dashboard", studentController.getDashboard);
// router.get("/profile", studentController.getProfile);
// router.patch("/profile", studentController.updateProfile);
// router.patch(
//   "/favorite-teachers/:teacherId",
//   studentController.addFavoriteTeacher,
// );
// router.delete(
//   "/favorite-teachers/:teacherId",
//   studentController.removeFavoriteTeacher,
// );

// export default router;

import express from "express";
import {
  addFavoriteTeacher,
  getDashboard,
  getProfile,
  removeFavoriteTeacher,
  updateProfile,
} from "../controllers/studentController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
// import ROLES from "../constants/roles.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/dashboard", getDashboard);
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/favorite-teachers/:teacherId", addFavoriteTeacher);
router.delete("/favorite-teachers/:teacherId", removeFavoriteTeacher);

export default router;
