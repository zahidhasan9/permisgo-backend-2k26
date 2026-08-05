import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import { getContacts, getIceConfig, getMessages, uploadAttachment } from "../controllers/chatController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(protect, authorize("student", "teacher"));
router.get("/contacts", getContacts);
router.get("/ice-config", getIceConfig);
router.get("/messages/:userId", getMessages);
router.post("/attachments", upload.single("file"), uploadAttachment);
export default router;
