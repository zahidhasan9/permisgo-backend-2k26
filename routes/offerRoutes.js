import express from "express";
import offerController from "../controllers/offerController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.get("/", offerController.getOffers);
router.get("/packages", offerController.getPackages);
router.get("/:slug", offerController.getOfferBySlug);

router.post("/", protect, authorize(ROLES.ADMIN), offerController.createOffer);
router.patch(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  offerController.updateOffer,
);
router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  offerController.deleteOffer,
);
router.post(
  "/packages/create",
  protect,
  authorize(ROLES.ADMIN),
  offerController.createPackage,
);

export default router;
