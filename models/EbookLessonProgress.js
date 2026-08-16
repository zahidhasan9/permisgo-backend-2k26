import mongoose from "mongoose";

const ebookLessonProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EbookLesson",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed"],
      default: "not-started",
      index: true,
    },
    readPercent: { type: Number, default: 0, min: 0, max: 100 },
    lastViewedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ebookLessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });

export default mongoose.model("EbookLessonProgress", ebookLessonProgressSchema);
