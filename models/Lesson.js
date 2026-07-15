// import mongoose from "mongoose";

// const lessonSchema = new mongoose.Schema(
//   {
//     booking: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Booking",
//       required: true,
//     },
//     student: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     teacher: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     lessonDate: { type: Date, required: true },
//     startTime: String,
//     endTime: String,
//     duration: Number,
//     status: {
//       type: String,
//       enum: ["scheduled", "in_progress", "completed", "cancelled"],
//       default: "scheduled",
//     },
//     attendance: {
//       studentConfirmed: { type: Boolean, default: false },
//       teacherConfirmed: { type: Boolean, default: false },
//       studentConfirmedAt: Date,
//       teacherConfirmedAt: Date,
//     },
//     lessonProgress: {
//       skillsCovered: [String],
//       teacherNotes: String,
//       studentNotes: String,
//       rating: Number,
//     },
//     downloadableFile: String,
//   },
//   { timestamps: true },
// );

// lessonSchema.index({ student: 1, lessonDate: 1 });
// lessonSchema.index({ teacher: 1, lessonDate: 1 });

// const Lesson = mongoose.model("Lesson", lessonSchema);
// export default Lesson;

import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requestedAt: Date,
    requestedDate: Date,
    startTime: String,
    endTime: String,
    reason: String,
    adminNote: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { _id: false },
);

const historySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const lessonSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
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
    lessonDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "scheduled",
        "in_progress",
        "awaiting_confirmation",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "scheduled",
    },
    attendance: {
      studentConfirmed: { type: Boolean, default: false },
      teacherConfirmed: { type: Boolean, default: false },
      studentStatus: {
        type: String,
        enum: ["pending", "present", "absent", "disputed"],
        default: "pending",
      },
      teacherStatus: {
        type: String,
        enum: ["pending", "present", "absent", "disputed"],
        default: "pending",
      },
      studentConfirmedAt: Date,
      teacherConfirmedAt: Date,
      finalisedByAdmin: { type: Boolean, default: false },
      adminNote: String,
    },
    lessonProgress: {
      skillsCovered: [String],
      teacherNotes: String,
      studentNotes: String,
      rating: { type: Number, min: 1, max: 5 },
      performance: {
        type: String,
        enum: [
          "not_assessed",
          "needs_improvement",
          "satisfactory",
          "good",
          "excellent",
        ],
        default: "not_assessed",
      },
      areasToImprove: [String],
      nextLessonRecommendation: String,
      teacherSubmittedAt: Date,
      studentConfirmedAt: Date,
      feedbackSubmittedAt: Date,
    },
    rescheduleRequest: {
      type: requestSchema,
      default: () => ({}),
    },
    cancellationRequest: {
      type: requestSchema,
      default: () => ({}),
    },
    cancellation: {
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: String,
      cancelledAt: Date,
    },
    startedAt: Date,
    completedAt: Date,
    downloadableFile: String,
    history: {
      type: [historySchema],
      default: [],
    },
  },
  { timestamps: true },
);

lessonSchema.index({ student: 1, lessonDate: 1 });
lessonSchema.index({ teacher: 1, lessonDate: 1 });
lessonSchema.index({ status: 1, lessonDate: 1 });
lessonSchema.index({ "rescheduleRequest.status": 1 });
lessonSchema.index({ "cancellationRequest.status": 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;
