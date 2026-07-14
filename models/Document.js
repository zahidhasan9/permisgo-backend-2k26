// import mongoose from "mongoose";

// const documentSchema = new mongoose.Schema(
//   {
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     title: { type: String, required: true },
//     type: {
//       type: String,
//       enum: [
//         "identity",
//         "license",
//         "certificate",
//         "insurance",
//         "proof_address",
//         "other",
//       ],
//       default: "other",
//     },
//     fileUrl: { type: String, required: true },
//     fileType: String,
//     fileSize: Number,
//     status: {
//       type: String,
//       enum: ["pending", "approved", "rejected"],
//       default: "pending",
//     },
//     rejectionReason: String,
//     uploadedAt: { type: Date, default: Date.now },
//     reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     reviewedAt: Date,
//   },
//   { timestamps: true },
// );

// const Document = mongoose.model("Document", documentSchema);
// export default Document;

import mongoose from "mongoose";

const reviewHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["approved", "rejected"],
      required: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reviewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    requirementKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    type: {
      type: String,
      enum: [
        "identity",
        "license",
        "certificate",
        "insurance",
        "proof_address",
        "other",
      ],
      default: "other",
    },

    documentSide: {
      type: String,
      enum: ["front", "back", "single"],
      default: "single",
    },

    originalFileName: {
      type: String,
      trim: true,
      default: "",
    },

    fileUrl: {
      type: String,
      required: true,
    },

    cloudinaryPublicId: {
      type: String,
      trim: true,
      default: "",
    },

    storage: {
      type: String,
      enum: ["cloudinary", "local"],
      default: "cloudinary",
    },

    resourceType: {
      type: String,
      trim: true,
      default: "",
    },

    fileType: {
      type: String,
      trim: true,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    version: {
      type: Number,
      default: 1,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewHistory: {
      type: [reviewHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

documentSchema.index({
  user: 1,
  requirementKey: 1,
});

const Document =
  mongoose.models.Document || mongoose.model("Document", documentSchema);

export default Document;
