import express from "express";
import supportController from "../controllers/supportController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.post("/public", supportController.createTicket);
router.use(protect);
router.post("/", supportController.createTicket);
router.get("/", supportController.getTickets);
router.patch(
  "/:id/reply",
  authorize(ROLES.ADMIN, ROLES.SUPPORT),
  supportController.replyTicket,
);

export default router;
