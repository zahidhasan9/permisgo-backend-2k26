import mongoose from "mongoose";

const learningProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LearningContent",
      required: true,
      index: true,
    },

    contentType: {
      type: String,
      enum: ["road-sign", "code-ebook", "knowledge-sheet", "live-replay"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed"],
      default: "not-started",
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },

    readPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    watchedSeconds: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
    },

    lastViewedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

learningProgressSchema.index({ student: 1, content: 1 }, { unique: true });

const LearningProgress = mongoose.model(
  "LearningProgress",
  learningProgressSchema,
);

export default LearningProgress;
