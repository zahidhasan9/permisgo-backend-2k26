import mongoose from "mongoose";
import slugify from "slugify";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, lowercase: true },
    excerpt: String,
    content: String,
    translations: {
      bn: {
        title: { type: String, trim: true, default: "" },
        excerpt: { type: String, trim: true, default: "" },
        content: { type: String, trim: true, default: "" },
      },
      fr: {
        title: { type: String, trim: true, default: "" },
        excerpt: { type: String, trim: true, default: "" },
        content: { type: String, trim: true, default: "" },
      },
    },
    coverImage: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: Date,
  },
  { timestamps: true },
);

const Blog = mongoose.model("Blog", blogSchema);
export default Blog;
