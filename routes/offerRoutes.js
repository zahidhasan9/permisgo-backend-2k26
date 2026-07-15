// import express from "express";
// import offerController from "../controllers/offerController";
// import { protect, authorize } from "../middlewares/authMiddleware";
// import ROLES from "../constants/roles";

// const router = express.Router();

// router.get("/", offerController.getOffers);
// router.get("/packages", offerController.getPackages);
// router.get("/:slug", offerController.getOfferBySlug);

// router.post("/", protect, authorize(ROLES.ADMIN), offerController.createOffer);
// router.patch(
//   "/:id",
//   protect,
//   authorize(ROLES.ADMIN),
//   offerController.updateOffer,
// );
// router.delete(
//   "/:id",
//   protect,
//   authorize(ROLES.ADMIN),
//   offerController.deleteOffer,
// );
// router.post(
//   "/packages/create",
//   protect,
//   authorize(ROLES.ADMIN),
//   offerController.createPackage,
// );

// export default router;

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
