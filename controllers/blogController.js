import slugify from "slugify";

import Blog from "../models/Blog.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {
  deleteStoredFile,
  getUploadedFileUrl,
} from "../utils/uploadHelpers.js";

const normalizeStatus = (value) =>
  value === "published" ? "published" : "draft";

const clean = (value) => String(value || "").trim();
const getLanguage = (value) => (["bn", "fr"].includes(value) ? value : "en");
const localizeBlog = (blog, language) => {
  const item = blog.toObject ? blog.toObject() : blog;
  if (language === "en") return item;
  const translated = item.translations?.[language] || {};
  return {
    ...item,
    title: translated.title || item.title,
    excerpt: translated.excerpt || item.excerpt,
    content: translated.content || item.content,
    language,
  };
};
const translationPayload = (body) => ({
  bn: {
    title: clean(body.title_bn),
    excerpt: clean(body.excerpt_bn),
    content: clean(body.content_bn),
  },
  fr: {
    title: clean(body.title_fr),
    excerpt: clean(body.excerpt_fr),
    content: clean(body.content_fr),
  },
});

const buildUniqueSlug = async (title, ignoredId = null) => {
  const base =
    slugify(String(title || "blog"), {
      lower: true,
      strict: true,
      trim: true,
    }) || "blog";
  let slug = base;
  let suffix = 2;

  while (
    await Blog.exists({
      slug,
      ...(ignoredId ? { _id: { $ne: ignoredId } } : {}),
    })
  ) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
};

export const getBlogs = asyncHandler(async (req, res) => {
  const language = getLanguage(req.query.lang);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const blogs = await Blog.find({ status: "published" })
    .populate("author", "name")
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit);
  sendResponse(
    res,
    200,
    "Blogs fetched.",
    blogs.map((blog) => localizeBlog(blog, language)),
  );
});

export const getAdminBlogs = asyncHandler(async (req, res) => {
  const filter = ["draft", "published"].includes(req.query.status)
    ? { status: req.query.status }
    : {};
  const blogs = await Blog.find(filter)
    .populate("author", "name")
    .sort({ updatedAt: -1 });
  sendResponse(res, 200, "Admin blogs fetched.", blogs);
});

export const getBlog = asyncHandler(async (req, res) => {
  const language = getLanguage(req.query.lang);
  const numericPosition = /^\d+$/.test(req.params.slug)
    ? Number(req.params.slug)
    : null;
  const query = numericPosition
    ? Blog.findOne({ status: "published" })
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(Math.max(numericPosition - 1, 0))
    : Blog.findOne({ slug: req.params.slug, status: "published" });
  const blog = await query.populate("author", "name");
  if (!blog) throw new ApiError(404, "Blog not found.");
  sendResponse(res, 200, "Blog fetched.", localizeBlog(blog, language));
});

export const createBlog = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  if (!title) throw new ApiError(400, "Blog title is required.");
  if (!req.file)
    throw new ApiError(400, "A Cloudinary cover image is required.");

  const status = normalizeStatus(req.body.status);
  const blog = await Blog.create({
    title,
    slug: await buildUniqueSlug(title),
    excerpt: String(req.body.excerpt || "").trim(),
    content: String(req.body.content || "").trim(),
    translations: translationPayload(req.body),
    coverImage: getUploadedFileUrl(req.file),
    author: req.user._id,
    status,
    publishedAt: status === "published" ? new Date() : null,
  });
  sendResponse(res, 201, "Blog created.", blog);
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found.");

  const oldImage = blog.coverImage;
  if (req.body.title !== undefined) {
    const title = String(req.body.title).trim();
    if (!title) throw new ApiError(400, "Blog title is required.");
    if (title !== blog.title)
      blog.slug = await buildUniqueSlug(title, blog._id);
    blog.title = title;
  }
  if (req.body.excerpt !== undefined)
    blog.excerpt = String(req.body.excerpt).trim();
  if (req.body.content !== undefined)
    blog.content = String(req.body.content).trim();
  for (const language of ["bn", "fr"]) {
    for (const field of ["title", "excerpt", "content"]) {
      const key = `${field}_${language}`;
      if (req.body[key] !== undefined)
        blog.set(`translations.${language}.${field}`, clean(req.body[key]));
    }
  }
  if (req.body.status !== undefined) {
    const nextStatus = normalizeStatus(req.body.status);
    if (nextStatus === "published" && blog.status !== "published") {
      blog.publishedAt = new Date();
    }
    blog.status = nextStatus;
  }
  const removeCoverImage = req.body.removeCoverImage === "true";
  if (req.file) blog.coverImage = getUploadedFileUrl(req.file);
  else if (removeCoverImage) blog.coverImage = "";

  await blog.save();
  if (
    (req.file || removeCoverImage) &&
    oldImage &&
    oldImage !== blog.coverImage
  ) {
    await deleteStoredFile(oldImage);
  }
  sendResponse(res, 200, "Blog updated.", blog);
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found.");
  await deleteStoredFile(blog.coverImage);
  sendResponse(res, 200, "Blog deleted.");
});

export default {
  getBlogs,
  getAdminBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
};
