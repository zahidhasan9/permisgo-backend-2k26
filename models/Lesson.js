import mongoose from "mongoose";

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
    startTime: String,
    endTime: String,
    duration: Number,
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    attendance: {
      studentConfirmed: { type: Boolean, default: false },
      teacherConfirmed: { type: Boolean, default: false },
      studentConfirmedAt: Date,
      teacherConfirmedAt: Date,
    },
    lessonProgress: {
      skillsCovered: [String],
      teacherNotes: String,
      studentNotes: String,
      rating: Number,
    },
    downloadableFile: String,
  },
  { timestamps: true },
);

lessonSchema.index({ student: 1, lessonDate: 1 });
lessonSchema.index({ teacher: 1, lessonDate: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
