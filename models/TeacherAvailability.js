import mongoose from "mongoose";

const timeRangeSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
  },
  { _id: false },
);

const weeklyDaySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    slots: {
      type: [timeRangeSchema],
      default: [],
    },
  },
  { _id: false },
);

const dateExceptionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    unavailable: {
      type: Boolean,
      default: true,
    },
    slots: {
      type: [timeRangeSchema],
      default: [],
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const getDefaultWeeklySchedule = () =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    enabled: dayOfWeek >= 1 && dayOfWeek <= 5,
    slots:
      dayOfWeek >= 1 && dayOfWeek <= 5
        ? [{ startTime: "09:00", endTime: "18:00" }]
        : [],
  }));

const teacherAvailabilitySchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    timezone: {
      type: String,
      trim: true,
      default: "Europe/Paris",
    },
    weeklySchedule: {
      type: [weeklyDaySchema],
      default: getDefaultWeeklySchedule,
    },
    dateExceptions: {
      type: [dateExceptionSchema],
      default: [],
    },
    lessonDurationOptions: {
      type: [Number],
      default: [30, 60, 90, 120],
    },
    bufferMinutes: {
      type: Number,
      min: 0,
      max: 120,
      default: 15,
    },
    slotIntervalMinutes: {
      type: Number,
      enum: [15, 30, 45, 60],
      default: 30,
    },
  },
  { timestamps: true },
);

const TeacherAvailability = mongoose.model(
  "TeacherAvailability",
  teacherAvailabilitySchema,
);

export default TeacherAvailability;
