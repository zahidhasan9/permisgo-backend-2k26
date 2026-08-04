import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true, maxlength: 1000 },
  answer: { type: String, required: true, trim: true, maxlength: 3000 },
}, { _id: true });

const examQuestionSchema = new mongoose.Schema({
  number: { type: Number, required: true, min: 1, max: 999, unique: true, index: true },
  title: { type: String, trim: true, maxlength: 200, default: "" },
  category: { type: String, trim: true, maxlength: 100, default: "General" },
  image: { type: String, trim: true, default: "" },
  videoUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  items: { type: [itemSchema], validate: [(items) => items.length > 0, "At least one question and answer is required."] },
  order: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.models.ExamQuestion || mongoose.model("ExamQuestion", examQuestionSchema);
