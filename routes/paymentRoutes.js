import express from "express";
import paymentController from "../controllers/paymentController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.use(protect);

router.post("/", paymentController.createPayment);
router.patch("/:id/verify", paymentController.verifyPayment);
router.get("/", paymentController.getPayments);
router.get("/invoices", paymentController.getInvoices);
router.get("/invoices/:id", paymentController.getInvoice);

export default router;
