import mongoose from "mongoose";

const attemptAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOptionIndex: { type: Number, min: 0, max: 3, required: true },
    correctOptionIndex: { type: Number, min: 0, max: 3, required: true },
    isCorrect: { type: Boolean, required: true },
    timeSpentSeconds: { type: Number, default: 0 },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    answers: { type: [attemptAnswerSchema], default: [] },
    totalQuestions: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ student: 1, quiz: 1, createdAt: -1 });

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
export default QuizAttempt;
