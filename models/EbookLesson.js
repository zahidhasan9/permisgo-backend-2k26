import mongoose from "mongoose";

const blockSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  bulletPoints: { type: [String], default: [] },
  footerText: { type: String, default: "" },
}, { _id: false });

const ebookLessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "EbookCourse", required: true, index: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: "EbookTopic", required: true, index: true },
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: "", trim: true },
  coverImage: { type: String, default: "" },
  contentBlocks: { type: [blockSchema], default: [] },
  videos: { type: [{ title: String, url: String, thumbnail: String, durationMinutes: { type: Number, default: 0 } }], default: [] },
  materials: { type: [{ title: String, fileUrl: String, readMinutes: { type: Number, default: 0 } }], default: [] },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ["draft", "active", "inactive"], default: "draft", index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

ebookLessonSchema.index({ topic: 1, order: 1, createdAt: 1 });

export default mongoose.model("EbookLesson", ebookLessonSchema);
