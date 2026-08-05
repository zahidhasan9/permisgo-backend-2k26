// import mongoose from "mongoose";
// import slugify from "slugify";

// const quizSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true, trim: true },
//     slug: { type: String, trim: true, lowercase: true, index: true },
//     type: {
//       type: String,
//       enum: [
//         "simple_series",
//         "mock_test",
//         "thematic_series",
//         "crash_test",
//         "road_sign",
//       ],
//       default: "simple_series",
//     },
//     description: { type: String, default: "" },
//     coverImage: { type: String, default: "" },
//     totalQuestions: { type: Number, default: 0 },
//     durationMinutes: { type: Number, default: 30 },
//     passingScore: { type: Number, default: 60 },
//     isPaid: { type: Boolean, default: false },
//     order: { type: Number, default: 0 },
//     status: {
//       type: String,
//       enum: ["active", "inactive", "deleted"],
//       default: "active",
//     },
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   },
//   { timestamps: true },
// );

// quizSchema.pre("save", function makeSlug() {
//   if (!this.slug && this.title) {
//     this.slug = slugify(this.title, { lower: true, strict: true });
//   }
// });

// const Quiz = mongoose.model("Quiz", quizSchema);
// export default Quiz;

import mongoose from "mongoose";
import slugify from "slugify";

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true, index: true },
    type: {
      type: String,
      enum: [
        "simple_series",
        "mock_test",
        "thematic_series",
        "crash_test",
        "road_sign",
        "code_ebook",
        "knowledge_sheet",
        "live_replay",
        "learn",
        "evaluation",
        "reserve_exam",
        "faq",
      ],
      default: "simple_series",
    },
    description: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    totalQuestions: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 30 },
    passingScore: { type: Number, default: 60 },
    isPaid: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

quizSchema.pre("save", function makeSlug() {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
});

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
