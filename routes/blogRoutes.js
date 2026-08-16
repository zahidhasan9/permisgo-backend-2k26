import express from "express";
import blogController from "../controllers/blogController.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import blogImageUpload from "../middlewares/blogUploadMiddleware.js";

const router = express.Router();

router.get("/", blogController.getBlogs);
router.get(
  "/admin/all",
  protect,
  authorize("admin"),
  blogController.getAdminBlogs,
);
router.get("/:slug", blogController.getBlog);
router.post(
  "/",
  protect,
  authorize("admin"),
  blogImageUpload,
  blogController.createBlog,
);
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  blogImageUpload,
  blogController.updateBlog,
);
router.delete("/:id", protect, authorize("admin"), blogController.deleteBlog);

export default router;
