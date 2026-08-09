import FAQ from "../models/FAQ.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

const sections = ["home", "general", "instructors", "locations", "driving-code"];

const cleanPayload = (body) => ({
  question: String(body.question || "").trim(),
  answer: String(body.answer || "").trim(),
  section: sections.includes(body.section) ? body.section : "general",
  category: String(body.category || "Driving lessons").trim(),
  order: Number.isFinite(Number(body.order)) ? Number(body.order) : 0,
  status: body.status === "inactive" ? "inactive" : "active",
  translations: {
    bn: { question: String(body.question_bn || "").trim(), answer: String(body.answer_bn || "").trim() },
    fr: { question: String(body.question_fr || "").trim(), answer: String(body.answer_fr || "").trim() },
  },
});

const localize = (item, lang) => { const data = item.toObject ? item.toObject() : item; if (!["bn", "fr"].includes(lang)) return data; const value = data.translations?.[lang] || {}; return { ...data, question: value.question || data.question, answer: value.answer || data.answer, language: lang }; };

export const getFaqs = asyncHandler(async (req, res) => {
  const filter = { status: "active" };
  if (sections.includes(req.query.section)) filter.section = req.query.section;
  const faqs = await FAQ.find(filter).sort({ section: 1, order: 1, createdAt: 1 });
  sendResponse(res, 200, "FAQs fetched.", faqs.map((item) => localize(item, req.query.lang)));
});

export const getAdminFaqs = asyncHandler(async (req, res) => {
  const filter = {};
  if (sections.includes(req.query.section)) filter.section = req.query.section;
  if (["active", "inactive"].includes(req.query.status)) filter.status = req.query.status;
  const faqs = await FAQ.find(filter).sort({ section: 1, order: 1, createdAt: 1 });
  sendResponse(res, 200, "Admin FAQs fetched.", faqs);
});

export const createFaq = asyncHandler(async (req, res) => {
  const payload = cleanPayload(req.body);
  if (!payload.question || !payload.answer) throw new ApiError(400, "Question and answer are required.");
  const faq = await FAQ.create(payload);
  sendResponse(res, 201, "FAQ created.", faq);
});

export const updateFaq = asyncHandler(async (req, res) => {
  const payload = cleanPayload(req.body);
  if (!payload.question || !payload.answer) throw new ApiError(400, "Question and answer are required.");
  const faq = await FAQ.findByIdAndUpdate(req.params.id, payload, { returnDocument: "after", runValidators: true });
  if (!faq) throw new ApiError(404, "FAQ not found.");
  sendResponse(res, 200, "FAQ updated.", faq);
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndDelete(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found.");
  sendResponse(res, 200, "FAQ deleted.");
});

export default { getFaqs, getAdminFaqs, createFaq, updateFaq, deleteFaq };
