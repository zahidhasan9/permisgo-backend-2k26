import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
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
    fileUrl: { type: String, required: true },
    fileType: String,
    fileSize: Number,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: String,
    uploadedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true },
);

const Document = mongoose.model("Document", documentSchema);
export default Document;
