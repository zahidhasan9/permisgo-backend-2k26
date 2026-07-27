import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    examType: { type: String, enum: ["code", "driving"], required: true },
    status: {
      type: String,
      enum: ["not_scheduled", "scheduled", "passed", "failed"],
      default: "not_scheduled",
    },
    examDate: Date,
    center: String,
    result: {
      score: Number,
      passed: Boolean,
      remarks: String,
    },
    apiReferenceId: String,
  },
  { timestamps: true },
);

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
