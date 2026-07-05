import FAQ from "../models/FAQ";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const getFaqs = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find(
    req.query.status ? { status: req.query.status } : { status: "active" },
  ).sort({ order: 1 });
  sendResponse(res, 200, "FAQs fetched.", faqs);
});

export const createFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.create(req.body);
  sendResponse(res, 201, "FAQ created.", faq);
});

export const updateFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!faq) throw new ApiError(404, "FAQ not found.");
  sendResponse(res, 200, "FAQ updated.", faq);
});

export const deleteFaq = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByIdAndDelete(req.params.id);
  if (!faq) throw new ApiError(404, "FAQ not found.");
  sendResponse(res, 200, "FAQ deleted.");
});
