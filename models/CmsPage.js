import mongoose from "mongoose";

const translationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    excerpt: { type: String, trim: true, default: "" },
    content: { type: String, default: "" },
    seoTitle: { type: String, trim: true, maxlength: 70, default: "" },
    seoDescription: { type: String, trim: true, maxlength: 180, default: "" },
    keywords: { type: [String], default: [] },
    imageAlt: { type: String, trim: true, default: "" },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const cmsPageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    translations: {
      en: { type: translationSchema, default: () => ({}) },
      bn: { type: translationSchema, default: () => ({}) },
      fr: { type: translationSchema, default: () => ({}) },
    },
    ogImage: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    noIndex: { type: Boolean, default: false },
    showInFooter: { type: Boolean, default: false, index: true },
    footerSection: {
      type: String,
      enum: ["about", "partnership", "services", "support"],
      default: "services",
    },
    footerOrder: { type: Number, default: 0 },
    pageTemplate: {
      type: String,
      enum: ["modern", "classic", "minimal"],
      default: "modern",
    },
    accentColor: { type: String, trim: true, default: "#123f88" },
    contentAlignment: {
      type: String,
      enum: ["left", "center"],
      default: "left",
    },
    ctaUrl: { type: String, trim: true, default: "" },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("CmsPage", cmsPageSchema);
