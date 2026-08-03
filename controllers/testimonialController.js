import Testimonial from "../models/Testimonial.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { deleteStoredFile, getUploadedFileUrl } from "../utils/uploadHelpers.js";

const payload = (body) => ({ name: String(body.name || "").trim(), role: String(body.role || "PermisGo learner").trim(), rating: Math.min(5, Math.max(1, Number(body.rating) || 5)), message: String(body.message || "").trim(), status: body.status === "inactive" ? "inactive" : "active" });

export const getTestimonials = asyncHandler(async (req, res) => { const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100); const items = await Testimonial.find({ status: "active" }).sort({ createdAt: -1 }).limit(limit); sendResponse(res, 200, "Testimonials fetched.", items); });
export const getAdminTestimonials = asyncHandler(async (req, res) => { const filter = ["active", "inactive"].includes(req.query.status) ? { status: req.query.status } : {}; const items = await Testimonial.find(filter).sort({ updatedAt: -1 }); sendResponse(res, 200, "Admin testimonials fetched.", items); });
export const createTestimonial = asyncHandler(async (req, res) => { const data = payload(req.body); if (!data.name || !data.message) throw new ApiError(400, "Name and message are required."); if (!req.file) throw new ApiError(400, "A Cloudinary profile image is required."); data.image = getUploadedFileUrl(req.file); const item = await Testimonial.create(data); sendResponse(res, 201, "Testimonial created.", item); });
export const updateTestimonial = asyncHandler(async (req, res) => { const item = await Testimonial.findById(req.params.id); if (!item) throw new ApiError(404, "Testimonial not found."); const oldImage = item.image; const removeImage = req.body.removeImage === "true"; Object.assign(item, payload(req.body)); if (req.file) item.image = getUploadedFileUrl(req.file); else if (removeImage) item.image = ""; await item.save(); if ((req.file || removeImage) && oldImage && oldImage !== item.image) await deleteStoredFile(oldImage); sendResponse(res, 200, "Testimonial updated.", item); });
export const deleteTestimonial = asyncHandler(async (req, res) => { const item = await Testimonial.findByIdAndDelete(req.params.id); if (!item) throw new ApiError(404, "Testimonial not found."); await deleteStoredFile(item.image); sendResponse(res, 200, "Testimonial deleted."); });
export default { getTestimonials, getAdminTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
