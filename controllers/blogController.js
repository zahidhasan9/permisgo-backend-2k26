import Blog from "../models/Blog";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const getBlogs = asyncHandler(async (req, res) => {
  const filter = req.query.status
    ? { status: req.query.status }
    : { status: "published" };
  if (req.user?.role === "admin" && !req.query.status) delete filter.status;
  const blogs = await Blog.find(filter)
    .populate("author", "name")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, "Blogs fetched.", blogs);
});

export const getBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug }).populate(
    "author",
    "name",
  );
  if (!blog) throw new ApiError(404, "Blog not found.");
  sendResponse(res, 200, "Blog fetched.", blog);
});

export const createBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.create({ ...req.body, author: req.user._id });
  sendResponse(res, 201, "Blog created.", blog);
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!blog) throw new ApiError(404, "Blog not found.");
  sendResponse(res, 200, "Blog updated.", blog);
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found.");
  sendResponse(res, 200, "Blog deleted.");
});
