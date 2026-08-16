import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    translations: {
      bn: {
        question: { type: String, default: "", trim: true },
        answer: { type: String, default: "", trim: true },
      },
      fr: {
        question: { type: String, default: "", trim: true },
        answer: { type: String, default: "", trim: true },
      },
    },
    section: {
      type: String,
      enum: ["home", "general", "instructors", "locations", "driving-code"],
      default: "general",
      index: true,
    },
    category: { type: String, default: "Driving lessons" },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

const FAQ = mongoose.model("FAQ", faqSchema);
export default FAQ;
