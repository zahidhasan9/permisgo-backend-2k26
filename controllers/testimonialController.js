import Testimonial from "../models/Testimonial";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const getTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ status: "active" }).sort({
    createdAt: -1,
  });
  sendResponse(res, 200, "Testimonials fetched.", testimonials);
});

export const createTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.create(req.body);
  sendResponse(res, 201, "Testimonial created.", item);
});

export const updateTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw new ApiError(404, "Testimonial not found.");
  sendResponse(res, 200, "Testimonial updated.", item);
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  const item = await Testimonial.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, "Testimonial not found.");
  sendResponse(res, 200, "Testimonial deleted.");
});
