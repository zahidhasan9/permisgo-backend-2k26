import CmsPage from "../models/CmsPage.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";

const languages = ["en", "bn", "fr"];
const cleanSlug = (value) =>
  String(value || "home")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "") || "home";
const cleanTranslation = (value = {}) => ({
  title: String(value.title || "").trim(),
  excerpt: String(value.excerpt || "").trim(),
  content: String(value.content || ""),
  seoTitle: String(value.seoTitle || "").trim(),
  seoDescription: String(value.seoDescription || "").trim(),
  keywords: Array.isArray(value.keywords)
    ? value.keywords
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean)
    : String(value.keywords || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
  imageAlt: String(value.imageAlt || "").trim(),
  settings:
    value.settings && typeof value.settings === "object" ? value.settings : {},
});

const localized = (page, language) => {
  const item = page.toObject ? page.toObject() : page;
  const requested = languages.includes(language) ? language : "en";
  const primary = item.translations?.[requested] || {};
  const fallback = item.translations?.en || {};
  const translation = primary.title
    ? {
        ...fallback,
        ...primary,
        settings: { ...(fallback.settings || {}), ...(primary.settings || {}) },
      }
    : fallback;
  return { ...item, language: requested, translation };
};

export const getPublicPage = asyncHandler(async (req, res) => {
  const page = await CmsPage.findOne({
    slug: cleanSlug(req.params.slug),
    status: "published",
  });
  if (!page) {
    res.statusCode = 404;
    throw new Error("CMS page not found.");
  }
  sendResponse(res, 200, "CMS page fetched.", localized(page, req.query.lang));
});

export const getPublicSitemapPages = asyncHandler(async (_req, res) => {
  const pages = await CmsPage.find({ status: "published", noIndex: false })
    .select("slug translations updatedAt")
    .lean();
  sendResponse(res, 200, "CMS sitemap pages fetched.", pages);
});

export const getFooterPages = asyncHandler(async (req, res) => {
  const pages = await CmsPage.find({ status: "published", showInFooter: true })
    .select("slug translations footerSection footerOrder")
    .sort({ footerSection: 1, footerOrder: 1, createdAt: 1 });
  sendResponse(
    res,
    200,
    "Footer pages fetched.",
    pages.map((page) => {
      const item = localized(page, req.query.lang);
      return {
        slug: item.slug,
        title: item.translation?.title || item.slug,
        footerSection: item.footerSection,
        footerOrder: item.footerOrder,
      };
    }),
  );
});

export const getAdminPages = asyncHandler(async (_req, res) => {
  const pages = await CmsPage.find().sort({ slug: 1 }).lean();
  sendResponse(res, 200, "CMS pages fetched.", pages);
});

export const upsertPage = asyncHandler(async (req, res) => {
  const slug = cleanSlug(req.params.slug || req.body.slug);
  const translations = {};
  for (const language of languages)
    translations[language] = cleanTranslation(
      req.body.translations?.[language],
    );
  if (!translations.en.title) {
    res.statusCode = 400;
    throw new Error("English title is required.");
  }
  const page = await CmsPage.findOneAndUpdate(
    { slug },
    {
      slug,
      translations,
      ogImage: String(req.body.ogImage || "").trim(),
      status: req.body.status === "published" ? "published" : "draft",
      noIndex: Boolean(req.body.noIndex),
      showInFooter: Boolean(req.body.showInFooter),
      footerSection: ["about", "partnership", "services", "support"].includes(
        req.body.footerSection,
      )
        ? req.body.footerSection
        : "services",
      footerOrder: Number.isFinite(Number(req.body.footerOrder))
        ? Number(req.body.footerOrder)
        : 0,
      pageTemplate: ["modern", "classic", "minimal"].includes(
        req.body.pageTemplate,
      )
        ? req.body.pageTemplate
        : "modern",
      accentColor: /^#[0-9a-f]{6}$/i.test(String(req.body.accentColor || ""))
        ? req.body.accentColor
        : "#123f88",
      contentAlignment:
        req.body.contentAlignment === "center" ? "center" : "left",
      ctaUrl: String(req.body.ctaUrl || "").trim(),
      updatedBy: req.user._id,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  sendResponse(res, 200, "CMS page saved.", page);
});

export const deletePage = asyncHandler(async (req, res) => {
  const slug = cleanSlug(req.params.slug);
  const page = await CmsPage.findOneAndDelete({ slug });
  if (!page) {
    res.statusCode = 404;
    throw new Error("CMS page not found.");
  }
  sendResponse(res, 200, "CMS page deleted.", { slug });
});

export default {
  getPublicPage,
  getPublicSitemapPages,
  getFooterPages,
  getAdminPages,
  upsertPage,
  deletePage,
};
