import Lesson from "../models/Lesson";
import Notification from "../models/Notification";
import ROLES from "../constants/roles";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const getLessons = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === ROLES.STUDENT) filter.student = req.user._id;
  if (req.user.role === ROLES.TEACHER) filter.teacher = req.user._id;
  if (req.query.status) filter.status = req.query.status;

  const lessons = await Lesson.find(filter)
    .populate("student", "name email phone")
    .populate("teacher", "name email phone")
    .populate("booking")
    .sort({ lessonDate: -1 });

  sendResponse(res, 200, "Lessons fetched.", lessons);
});

export const getLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id)
    .populate("student", "name email phone")
    .populate("teacher", "name email phone")
    .populate("booking");

  if (!lesson) throw new ApiError(404, "Lesson not found.");
  sendResponse(res, 200, "Lesson fetched.", lesson);
});

export const startLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  lesson.status = "in_progress";
  await lesson.save();

  await Notification.create([
    {
      user: lesson.student,
      title: "Confirm lesson attendance",
      message: "Please confirm your attendance within 15 minutes.",
      type: "attendance",
      actionUrl: `/student/lessons/${lesson._id}`,
      scheduledAt: new Date(),
    },
    {
      user: lesson.teacher,
      title: "Confirm lesson attendance",
      message: "Please confirm your attendance within 15 minutes.",
      type: "attendance",
      actionUrl: `/teacher/lessons/${lesson._id}`,
      scheduledAt: new Date(),
    },
  ]);

  sendResponse(
    res,
    200,
    "Lesson started. Attendance notifications created.",
    lesson,
  );
});

export const confirmAttendance = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  if (String(lesson.student) === String(req.user._id)) {
    lesson.attendance.studentConfirmed = true;
    lesson.attendance.studentConfirmedAt = new Date();
  }

  if (String(lesson.teacher) === String(req.user._id)) {
    lesson.attendance.teacherConfirmed = true;
    lesson.attendance.teacherConfirmedAt = new Date();
  }

  await lesson.save();
  sendResponse(res, 200, "Attendance confirmed.", lesson);
});

export const completeLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, "Lesson not found.");

  lesson.status = "completed";
  lesson.lessonProgress = {
    ...lesson.lessonProgress,
    ...req.body.lessonProgress,
  };
  await lesson.save();

  sendResponse(res, 200, "Lesson completed.", lesson);
});
