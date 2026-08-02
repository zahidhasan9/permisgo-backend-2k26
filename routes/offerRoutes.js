import express from "express";
import {
  createOffer,
  deleteOffer,
  getOfferById,
  getOffers,
  updateOffer,
} from "../controllers/offerController.js";

import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("admin"), createOffer);

router.get("/", getOffers); //?category=cpf

router.get("/:id", getOfferById);

router.patch("/:id", protect, authorize("admin"), updateOffer);

router.delete("/:id", protect, authorize("admin"), deleteOffer);

export default router;
