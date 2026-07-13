import Document from "../models/Document";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import { getUploadedFileUrl } from "../utils/uploadHelpers.js";

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File is required.");

  const document = await Document.create({
    user: req.user._id,
    title: req.body.title || req.file.originalname,
    type: req.body.type || "other",
    fileUrl: getUploadedFileUrl(req.file),
    fileType: req.file.mimetype,
    fileSize: req.file.size,
  });

  sendResponse(res, 201, "Document uploaded.", document);
});

export const getDocuments = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const documents = await Document.find(filter)
    .populate("user", "name email role")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, "Documents fetched.", documents);
});

export const reviewDocument = asyncHandler(async (req, res) => {
  const document = await Document.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    },
    { new: true, runValidators: true },
  );
  if (!document) throw new ApiError(404, "Document not found.");
  sendResponse(res, 200, "Document reviewed.", document);
});
