import express from "express";
import teacherController from "../controllers/teacherController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.get("/public", teacherController.getPublicTeachers);

router.use(protect, authorize(ROLES.TEACHER));

router.get("/dashboard", teacherController.getDashboard);
router.get("/profile", teacherController.getProfile);
router.patch("/profile", teacherController.updateProfile);
router.get("/vehicles", teacherController.getVehicles);
router.post("/vehicles", teacherController.addVehicle);
router.get("/locations", teacherController.getLocations);
router.post("/locations", teacherController.addLocation);

export default router;
