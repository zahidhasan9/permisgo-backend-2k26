// import express from "express";
// import {
//   addFavoriteTeacher,
//   getDashboard,
//   getProfile,
//   removeFavoriteTeacher,
//   updateProfile,
// } from "../controllers/studentController.js";
// import { protect, authorize } from "../middlewares/authMiddleware.js";
// // import ROLES from "../constants/roles.js";

// const router = express.Router();

// router.use(protect, authorize("student"));

// router.get("/dashboard", getDashboard);
// router.get("/profile", getProfile);
// router.patch("/profile", updateProfile);
// router.patch("/favorite-teachers/:teacherId", addFavoriteTeacher);
// router.delete("/favorite-teachers/:teacherId", removeFavoriteTeacher);

// export default router;

import express from "express";
import {
  addFavoriteTeacher,
  getDashboard,
  getProfile,
  removeFavoriteTeacher,
  updateProfile,
} from "../controllers/studentController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/dashboard", getDashboard);
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/favorite-teachers/:teacherId", addFavoriteTeacher);
router.delete("/favorite-teachers/:teacherId", removeFavoriteTeacher);

export default router;
