import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    status: { type: String, enum: ["visible", "hidden"], default: "visible" },
  },
  { timestamps: true },
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
