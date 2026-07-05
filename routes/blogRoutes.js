import express from "express";
import blogController from "../controllers/blogController";
import { protect, authorize } from "../middlewares/authMiddleware";
import ROLES from "../constants/roles";

const router = express.Router();

router.get("/", blogController.getBlogs);
router.get("/:slug", blogController.getBlog);
router.post("/", protect, authorize(ROLES.ADMIN), blogController.createBlog);
router.patch(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  blogController.updateBlog,
);
router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  blogController.deleteBlog,
);

export default router;
