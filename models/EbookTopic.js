import mongoose from "mongoose";

const ebookTopicSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EbookCourse",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

ebookTopicSchema.index({ course: 1, title: 1 }, { unique: true });

export default mongoose.model("EbookTopic", ebookTopicSchema);
