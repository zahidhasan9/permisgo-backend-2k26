// import express from "express";
// import teacherController from "../controllers/teacherController";
// import { protect, authorize } from "../middlewares/authMiddleware";
// import ROLES from "../constants/roles";

// const router = express.Router();

// router.get("/public", teacherController.getPublicTeachers);

// router.use(protect, authorize(ROLES.TEACHER));

// router.get("/dashboard", teacherController.getDashboard);
// router.get("/profile", teacherController.getProfile);
// router.patch("/profile", teacherController.updateProfile);
// router.get("/vehicles", teacherController.getVehicles);
// router.post("/vehicles", teacherController.addVehicle);
// router.get("/locations", teacherController.getLocations);
// router.post("/locations", teacherController.addLocation);

// export default router;

import express from "express";

import {
  addLocation,
  addVehicle,
  getDashboard,
  getLocations,
  getProfile,
  getPublicTeachers,
  getVehicles,
  updateProfile,
} from "../controllers/teacherController.js";

import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/public", getPublicTeachers);

/**
 * below routes only teacher use
 */
router.use(protect, authorize("teacher"));

router.get("/dashboard", getDashboard);

router.get("/profile", getProfile);

router.patch("/profile", updateProfile);

router.get("/vehicles", getVehicles);

router.post("/vehicles", addVehicle);

router.get("/locations", getLocations);

router.post("/locations", addLocation);

export default router;
