// import express from "express";
// import documentController from "../controllers/documentController.js";
// import upload from "../middlewares/uploadMiddleware.js";
// import { protect, authorize } from "../middlewares/authMiddleware.js";

// const router = express.Router();
// router.use(protect);
// router.get("/stats", documentController.getDocumentStats);
// router.get("/", documentController.getDocuments);
// router.post("/", upload.single("file"), documentController.uploadDocument);
// router.get("/:id", documentController.getDocumentById);
// router.patch(
//   "/:id/resubmit",
//   upload.single("file"),
//   documentController.resubmitDocument,
// );
// router.patch(
//   "/:id/review",
//   authorize("admin"),
//   documentController.reviewDocument,
// );
// router.delete("/:id", documentController.deleteDocument);

// export default router;

import express from "express";
import documentController from "../controllers/documentController.js";
import upload from "../middlewares/uploadMiddleware.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(protect);
router.get("/users", authorize("admin"), documentController.getDocumentUsers);

router.get(
  "/user/:userId",
  authorize("admin"),
  documentController.getDocumentsByUser,
);
router.get("/stats", documentController.getDocumentStats);
router.get("/", documentController.getDocuments);
router.post("/", upload.single("file"), documentController.uploadDocument);
router.get("/:id", documentController.getDocumentById);
router.patch(
  "/:id/resubmit",
  upload.single("file"),
  documentController.resubmitDocument,
);
router.patch(
  "/:id/review",
  authorize("admin"),
  documentController.reviewDocument,
);
router.delete("/:id", documentController.deleteDocument);

export default router;
