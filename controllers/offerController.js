import Offer from "../models/Offer";
import Package from "../models/Package";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import { getPagination, getMeta } from "../utils/pagination";

export const getOffers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Offer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Offer.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Offers fetched.", items, getMeta(page, limit, total));
});

export const getOfferBySlug = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ slug: req.params.slug });
  if (!offer) throw new ApiError(404, "Offer not found.");
  sendResponse(res, 200, "Offer fetched.", offer);
});

export const createOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.create(req.body);
  sendResponse(res, 201, "Offer created.", offer);
});

export const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!offer) throw new ApiError(404, "Offer not found.");
  sendResponse(res, 200, "Offer updated.", offer);
});

export const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) throw new ApiError(404, "Offer not found.");
  sendResponse(res, 200, "Offer deleted.");
});

export const createPackage = asyncHandler(async (req, res) => {
  const item = await Package.create(req.body);
  sendResponse(res, 201, "Package created.", item);
});

export const getPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find().populate(
    "offer",
    "title slug category",
  );
  sendResponse(res, 200, "Packages fetched.", packages);
});
