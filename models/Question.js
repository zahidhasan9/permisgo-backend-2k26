// import mongoose from "mongoose";

// const optionSchema = new mongoose.Schema(
//   {
//     text: { type: String, required: true, trim: true },
//     image: { type: String, default: "" },
//     order: { type: Number, default: 0 },
//   },
//   { _id: false },
// );

// const questionSchema = new mongoose.Schema(
//   {
//     quiz: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Quiz",
//       required: true,
//       index: true,
//     },
//     questionText: { type: String, required: true, trim: true },
//     questionImage: { type: String, default: "" },
//     voiceText: { type: String, default: "" },
//     options: {
//       type: [optionSchema],
//       validate: {
//         validator(value) {
//           return Array.isArray(value) && value.length === 4;
//         },
//         message: "Question must have exactly 4 options.",
//       },
//       required: true,
//     },
//     correctOptionIndex: { type: Number, min: 0, max: 3, required: true },
//     explanationText: { type: String, default: "" },
//     explanationImage: { type: String, default: "" },
//     markedAnswerImage: { type: String, default: "" },
//     topic: { type: String, default: "" },
//     difficulty: {
//       type: String,
//       enum: ["easy", "medium", "hard"],
//       default: "medium",
//     },
//     order: { type: Number, default: 0 },
//     status: {
//       type: String,
//       enum: ["active", "inactive", "deleted"],
//       default: "active",
//     },
//   },
//   { timestamps: true },
// );

// const Question = mongoose.model("Question", questionSchema);
// export default Question;

import mongoose from "mongoose";

const questionOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
    },

    questionImage: {
      type: String,
      default: "",
    },

    voiceText: {
      type: String,
      default: "",
    },

    options: {
      type: [questionOptionSchema],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length === 4;
        },
        message: "Question must have exactly 4 options.",
      },
      required: true,
    },

    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      default: 0,
    },

    explanationText: {
      type: String,
      default: "",
    },

    explanationImage: {
      type: String,
      default: "",
    },

    markedAnswerImage: {
      type: String,
      default: "",
    },

    topic: {
      type: String,
      default: "",
      index: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    order: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
