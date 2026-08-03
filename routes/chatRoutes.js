import express from "express";
import { getContacts, getMessages } from "../controllers/chatController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(protect, authorize("student", "teacher"));
router.get("/contacts", getContacts);
router.get("/messages/:userId", getMessages);
export default router;
