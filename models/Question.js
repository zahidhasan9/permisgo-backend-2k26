import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
    questionText: { type: String, required: true },
    image: String,
    options: [
      {
        text: String,
        isCorrect: Boolean,
      },
    ],
    explanation: String,
    topic: String,
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { timestamps: true },
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
