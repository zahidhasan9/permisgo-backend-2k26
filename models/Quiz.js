import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["simple_series", "mock_test", "thematic_series", "crash_test"],
      required: true,
    },
    totalQuestions: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 30 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
