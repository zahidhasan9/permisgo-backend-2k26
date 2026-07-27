import Document from "../models/Document.js";
import User from "../models/User.js";

import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

import {
  deleteStoredFile,
  getUploadedFileUrl,
} from "../utils/uploadHelpers.js";

const ALLOWED_DOCUMENT_TYPES = [
  "identity",
  "license",
  "certificate",
  "insurance",
  "proof_address",
  "other",
];

const ALLOWED_DOCUMENT_SIDES = ["front", "back", "single"];

const ALLOWED_REQUIREMENT_KEYS = [
  // Student documents
  "identity_front",
  "identity_back",
  "license_front",
  "license_back",
  "proof_address",
  "medical_certificate",

  // Teacher documents
  "teacher_identity_front",
  "teacher_identity_back",
  "teacher_license_front",
  "teacher_license_back",
  "teacher_qualification",
  "teacher_insurance",
  "teacher_business_registration",
  "teacher_proof_address",
];

const getOwnerId = (document) => {
  return document.user?._id || document.user;
};

const isDocumentOwner = (document, user) => {
  const ownerId = getOwnerId(document);

  return ownerId?.toString() === user._id.toString();
};

const checkDocumentAccess = (document, user) => {
  const isAdmin = user.role === "admin";

  const isOwner = isDocumentOwner(document, user);

  if (!isAdmin && !isOwner) {
    throw new ApiError(
      403,
      "You do not have permission to access this document.",
    );
  }
};

const validateDocumentFields = ({ type, documentSide, requirementKey }) => {
  if (!ALLOWED_DOCUMENT_TYPES.includes(type)) {
    throw new ApiError(400, "Invalid document type.");
  }

  if (!ALLOWED_DOCUMENT_SIDES.includes(documentSide)) {
    throw new ApiError(400, "Invalid document side.");
  }

  if (!ALLOWED_REQUIREMENT_KEYS.includes(requirementKey)) {
    throw new ApiError(400, "Invalid document requirement.");
  }
};

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getFileStorage = (file) => {
  if (file?.storage === "cloudinary") {
    return "cloudinary";
  }

  return "local";
};

/**
 * Student:
 * নতুন document upload
 */
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Document file is required.");
  }

  const fileUrl = getUploadedFileUrl(req.file);

  if (!fileUrl) {
    throw new ApiError(500, "Uploaded document URL could not be generated.");
  }

  try {
    const requirementKey = String(req.body.requirementKey || "").trim();

    const type = String(req.body.type || "other").trim();

    const documentSide = String(req.body.documentSide || "single").trim();

    validateDocumentFields({
      type,
      documentSide,
      requirementKey,
    });

    const existingDocument = await Document.findOne({
      user: req.user._id,
      requirementKey,
    });

    if (existingDocument) {
      if (existingDocument.status === "rejected") {
        throw new ApiError(
          409,
          "This document was rejected. Please use the resubmit option.",
        );
      }

      throw new ApiError(409, "This document has already been submitted.");
    }

    const document = await Document.create({
      user: req.user._id,

      requirementKey,

      title: String(req.body.title || req.file.originalname).trim(),

      type,

      documentSide,

      originalFileName: req.file.originalname,

      fileUrl,

      cloudinaryPublicId: req.file.public_id || req.file.filename || "",

      storage: getFileStorage(req.file),

      resourceType: req.file.resource_type || "",

      fileType: req.file.mimetype || "",

      fileSize: req.file.size || 0,

      status: "pending",

      rejectionReason: "",

      version: 1,

      uploadedAt: new Date(),
    });

    await document.populate("user", "name email phone role");

    return sendResponse(res, 201, "Document uploaded successfully.", document);
  } catch (error) {
    /*
     * Middleware আগেই Cloudinary-তে file upload করেছে।
     * Database save বা validation fail হলে নতুন file delete হবে।
     */
    await deleteStoredFile(fileUrl);

    throw error;
  }
});

/**
 * Student:
 * নিজের documents
 *
 * Admin:
 * সব student documents
 */
export const getDocuments = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const skip = (page - 1) * limit;

  const filter = {};

  if (req.user.role !== "admin") {
    filter.user = req.user._id;
  }

  const status = String(req.query.status || "").trim();

  const type = String(req.query.type || "").trim();

  const search = String(req.query.search || "").trim();

  if (status && status !== "all") {
    filter.status = status;
  }

  if (type && type !== "all") {
    filter.type = type;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    const searchConditions = [
      {
        title: searchRegex,
      },
      {
        originalFileName: searchRegex,
      },
      {
        requirementKey: searchRegex,
      },
    ];

    if (req.user.role === "admin") {
      const matchingUsers = await User.find({
        $or: [
          {
            name: searchRegex,
          },
          {
            email: searchRegex,
          },
          {
            phone: searchRegex,
          },
        ],
      }).select("_id");

      searchConditions.push({
        user: {
          $in: matchingUsers.map((user) => user._id),
        },
      });
    }

    filter.$or = searchConditions;
  }

  const [documents, total] = await Promise.all([
    Document.find(filter)
      .populate("user", "name email phone role")
      .populate("reviewedBy", "name email")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit),

    Document.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Documents fetched successfully.", {
    documents,

    pagination: {
      page,
      limit,
      total,

      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  });
});

/**
 * Student:
 * নিজের document statistics
 *
 * Admin:
 * সব document statistics
 */
export const getDocumentStats = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "admin"
      ? {}
      : {
          user: req.user._id,
        };

  const [total, pending, approved, rejected] = await Promise.all([
    Document.countDocuments(filter),

    Document.countDocuments({
      ...filter,
      status: "pending",
    }),

    Document.countDocuments({
      ...filter,
      status: "approved",
    }),

    Document.countDocuments({
      ...filter,
      status: "rejected",
    }),
  ]);

  return sendResponse(res, 200, "Document statistics fetched successfully.", {
    total,
    pending,
    approved,
    rejected,
  });
});

/**
 * Student/Admin:
 * একটি document-এর details
 */
export const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate("user", "name email phone role")
    .populate("reviewedBy", "name email");

  if (!document) {
    throw new ApiError(404, "Document not found.");
  }

  checkDocumentAccess(document, req.user);

  return sendResponse(res, 200, "Document fetched successfully.", document);
});

/**
 * Student:
 * rejected document আবার upload
 */
export const resubmitDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "A new document file is required.");
  }

  const newFileUrl = getUploadedFileUrl(req.file);

  if (!newFileUrl) {
    throw new ApiError(500, "Uploaded document URL could not be generated.");
  }

  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      throw new ApiError(404, "Document not found.");
    }

    checkDocumentAccess(document, req.user);

    if (req.user.role !== "admin" && document.status !== "rejected") {
      throw new ApiError(400, "Only rejected documents can be resubmitted.");
    }

    const type = String(req.body.type || document.type).trim();

    const documentSide = String(
      req.body.documentSide || document.documentSide,
    ).trim();

    const requirementKey = String(
      req.body.requirementKey || document.requirementKey,
    ).trim();

    validateDocumentFields({
      type,
      documentSide,
      requirementKey,
    });

    const oldFileUrl = document.fileUrl;

    document.title = String(req.body.title || document.title).trim();

    document.type = type;

    document.documentSide = documentSide;

    document.requirementKey = requirementKey;

    document.originalFileName = req.file.originalname;

    document.fileUrl = newFileUrl;

    document.cloudinaryPublicId = req.file.public_id || req.file.filename || "";

    document.storage = getFileStorage(req.file);

    document.resourceType = req.file.resource_type || "";

    document.fileType = req.file.mimetype || "";

    document.fileSize = req.file.size || 0;

    document.status = "pending";

    document.rejectionReason = "";

    document.reviewedBy = null;

    document.reviewedAt = null;

    document.version = Number(document.version || 1) + 1;

    document.uploadedAt = new Date();

    await document.save();

    if (oldFileUrl && oldFileUrl !== newFileUrl) {
      await deleteStoredFile(oldFileUrl);
    }

    await document.populate("user", "name email phone role");

    return sendResponse(
      res,
      200,
      "Document resubmitted successfully.",
      document,
    );
  } catch (error) {
    /*
     * Resubmit fail হলে নতুন Cloudinary file delete হবে।
     */
    await deleteStoredFile(newFileUrl);

    throw error;
  }
});

/**
 * Admin:
 * document approve অথবা reject
 */
export const reviewDocument = asyncHandler(async (req, res) => {
  const status = String(req.body.status || "")
    .trim()
    .toLowerCase();

  const rejectionReason = String(req.body.rejectionReason || "").trim();

  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Status must be approved or rejected.");
  }

  if (status === "rejected" && !rejectionReason) {
    throw new ApiError(400, "Rejection reason is required.");
  }

  const document = await Document.findById(req.params.id);

  if (!document) {
    throw new ApiError(404, "Document not found.");
  }

  const reviewedAt = new Date();

  document.status = status;

  document.rejectionReason = status === "rejected" ? rejectionReason : "";

  document.reviewedBy = req.user._id;

  document.reviewedAt = reviewedAt;

  if (!Array.isArray(document.reviewHistory)) {
    document.reviewHistory = [];
  }

  document.reviewHistory.push({
    status,

    reason: status === "rejected" ? rejectionReason : "",

    reviewedBy: req.user._id,

    reviewedAt,
  });

  await document.save();

  await document.populate([
    {
      path: "user",
      select: "name email phone role",
    },
    {
      path: "reviewedBy",
      select: "name email",
    },
  ]);

  return sendResponse(res, 200, `Document ${status} successfully.`, document);
});

/**
 * Student:
 * pending/rejected document delete
 *
 * Admin:
 * যেকোনো document delete
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    throw new ApiError(404, "Document not found.");
  }

  checkDocumentAccess(document, req.user);

  if (req.user.role !== "admin" && document.status === "approved") {
    throw new ApiError(
      400,
      "Approved documents cannot be deleted by students.",
    );
  }

  const fileUrl = document.fileUrl;

  await document.deleteOne();

  if (fileUrl) {
    await deleteStoredFile(fileUrl);
  }

  return sendResponse(res, 200, "Document deleted successfully.");
});

/**
 * Admin:
 * User-wise grouped document list
 *
 * GET /api/documents/users
 */
export const getDocumentUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

  const skip = (page - 1) * limit;

  const search = String(req.query.search || "").trim();

  const role = String(req.query.role || "all")
    .trim()
    .toLowerCase();

  const status = String(req.query.status || "all")
    .trim()
    .toLowerCase();

  const allowedRoles = ["all", "student", "teacher"];

  const allowedStatuses = ["all", "pending", "approved", "rejected"];

  if (!allowedRoles.includes(role)) {
    throw new ApiError(400, "Invalid user role filter.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid document status filter.");
  }

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDetails",
      },
    },

    {
      $unwind: "$userDetails",
    },

    {
      $match: {
        "userDetails.role": {
          $in: ["student", "teacher"],
        },
      },
    },
  ];

  if (role !== "all") {
    pipeline.push({
      $match: {
        "userDetails.role": role,
      },
    });
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const searchRegex = new RegExp(escapedSearch, "i");

    pipeline.push({
      $match: {
        $or: [
          {
            "userDetails.name": searchRegex,
          },
          {
            "userDetails.email": searchRegex,
          },
          {
            "userDetails.phone": searchRegex,
          },
        ],
      },
    });
  }

  pipeline.push({
    $group: {
      _id: "$userDetails._id",

      user: {
        $first: {
          _id: "$userDetails._id",
          name: "$userDetails.name",
          email: "$userDetails.email",
          phone: "$userDetails.phone",
          role: "$userDetails.role",
          avatar: "$userDetails.avatar",
          status: "$userDetails.status",
        },
      },

      totalDocuments: {
        $sum: 1,
      },

      pendingDocuments: {
        $sum: {
          $cond: [
            {
              $eq: ["$status", "pending"],
            },
            1,
            0,
          ],
        },
      },

      approvedDocuments: {
        $sum: {
          $cond: [
            {
              $eq: ["$status", "approved"],
            },
            1,
            0,
          ],
        },
      },

      rejectedDocuments: {
        $sum: {
          $cond: [
            {
              $eq: ["$status", "rejected"],
            },
            1,
            0,
          ],
        },
      },

      latestUpload: {
        $max: {
          $ifNull: ["$uploadedAt", "$createdAt"],
        },
      },
    },
  });

  if (status !== "all") {
    const statusFieldMap = {
      pending: "pendingDocuments",
      approved: "approvedDocuments",
      rejected: "rejectedDocuments",
    };

    pipeline.push({
      $match: {
        [statusFieldMap[status]]: {
          $gt: 0,
        },
      },
    });
  }

  pipeline.push(
    {
      $sort: {
        latestUpload: -1,
      },
    },

    {
      $facet: {
        users: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],

        pagination: [
          {
            $count: "total",
          },
        ],
      },
    },
  );

  const [result] = await Document.aggregate(pipeline);

  const users = result?.users || [];

  const total = result?.pagination?.[0]?.total || 0;

  return sendResponse(res, 200, "Document users fetched successfully.", {
    users,

    pagination: {
      page,
      limit,
      total,

      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  });
});

/**
 * Admin:
 * একটি নির্দিষ্ট user-এর সব documents
 *
 * GET /api/documents/user/:userId
 */
export const getDocumentsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .select(
      "name email phone role avatar status address city country createdAt",
    )
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (!["student", "teacher"].includes(user.role)) {
    throw new ApiError(400, "This user does not have document submissions.");
  }

  const documents = await Document.find({
    user: userId,
  })
    .populate("reviewedBy", "name email role")
    .sort({
      createdAt: -1,
    });

  const summary = {
    total: documents.length,

    pending: documents.filter((document) => document.status === "pending")
      .length,

    approved: documents.filter((document) => document.status === "approved")
      .length,

    rejected: documents.filter((document) => document.status === "rejected")
      .length,
  };

  const requiredKeys = {
    student: [
      "identity_front",
      "identity_back",
      "license_front",
      "license_back",
      "proof_address",
    ],

    teacher: [
      "teacher_identity_front",
      "teacher_identity_back",
      "teacher_license_front",
      "teacher_license_back",
      "teacher_qualification",
      "teacher_insurance",
    ],
  };

  const userRequiredKeys = requiredKeys[user.role] || [];

  const allRequiredApproved = userRequiredKeys.every((requirementKey) =>
    documents.some(
      (document) =>
        document.requirementKey === requirementKey &&
        document.status === "approved",
    ),
  );

  let overallStatus = "incomplete";

  if (summary.total === 0) {
    overallStatus = "not_started";
  } else if (allRequiredApproved) {
    overallStatus = "verified";
  } else if (summary.rejected > 0) {
    overallStatus = "action_required";
  } else if (summary.pending > 0) {
    overallStatus = "under_review";
  }

  return sendResponse(res, 200, "User documents fetched successfully.", {
    user,
    documents,
    summary,
    overallStatus,
  });
});

export default {
  uploadDocument,
  getDocuments,
  getDocumentStats,
  getDocumentById,
  getDocumentUsers,
  getDocumentsByUser,
  resubmitDocument,
  reviewDocument,
  deleteDocument,
};
