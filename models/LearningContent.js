// import mongoose from "mongoose";

// const learningContentSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     type: {
//       type: String,
//       enum: ["road-sign", "code-ebook", "knowledge-sheet", "live-replay"],
//       required: true,
//     },

//     subtitle: {
//       type: String,
//       default: "",
//     },

//     category: {
//       type: String,
//       default: "",
//     },

//     topicCode: {
//       type: String,
//       enum: ["", "L", "C", "R", "U", "D", "HAS", "P", "M", "S", "E"],
//       default: "",
//     },

//     difficulty: {
//       type: String,
//       enum: ["beginner", "easy", "medium", "hard", "exam-focus"],
//       default: "beginner",
//     },

//     description: {
//       type: String,
//       default: "",
//     },

//     content: {
//       type: String,
//       default: "",
//     },

//     image: {
//       type: String,
//       default: "",
//     },

//     fileUrl: {
//       type: String,
//       default: "",
//     },

//     videoUrl: {
//       type: String,
//       default: "",
//     },

//     tags: {
//       type: [String],
//       default: [],
//     },

//     order: {
//       type: Number,
//       default: 0,
//     },

//     status: {
//       type: String,
//       enum: ["draft", "active", "inactive"],
//       default: "active",
//     },

//     isFeatured: {
//       type: Boolean,
//       default: false,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   { timestamps: true },
// );

// const LearningContent = mongoose.model(
//   "LearningContent",
//   learningContentSchema,
// );

// export default LearningContent;

import mongoose from "mongoose";

const learningContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["road-sign", "code-ebook", "knowledge-sheet", "live-replay"],
      required: true,
      index: true,
    },

    subtitle: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "",
      index: true,
    },

    topicCode: {
      type: String,
      enum: ["", "L", "C", "R", "U", "D", "HAS", "P", "M", "S", "E"],
      default: "",
      index: true,
    },

    difficulty: {
      type: String,
      enum: ["beginner", "easy", "medium", "hard", "exam-focus"],
      default: "beginner",
    },

    description: {
      type: String,
      default: "",
    },

    content: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    videoUrl: {
      type: String,
      default: "",
    },

    relatedQuiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    order: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "active",
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

learningContentSchema.index({ type: 1, status: 1, order: 1 });

const LearningContent = mongoose.model(
  "LearningContent",
  learningContentSchema,
);

export default LearningContent;
