import express from "express";
import controller from "../controllers/cmsPageController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/sitemap", controller.getPublicSitemapPages);
router.get("/footer", controller.getFooterPages);
router.get("/admin/all", protect, authorize("admin"), controller.getAdminPages);
router.put("/admin/:slug", protect, authorize("admin"), controller.upsertPage);
router.delete("/admin/:slug", protect, authorize("admin"), controller.deletePage);
router.get("/:slug", controller.getPublicPage);
export default router;
