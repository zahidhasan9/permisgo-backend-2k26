import Exam from "../models/Exam";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const createExamRequest = asyncHandler(async (req, res) => {
  const exam = await Exam.create({ ...req.body, student: req.user._id });
  sendResponse(res, 201, "Exam request created.", exam);
});

export const getMyExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find({ student: req.user._id }).sort({
    createdAt: -1,
  });
  sendResponse(res, 200, "Exams fetched.", exams);
});

export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!exam) throw new ApiError(404, "Exam not found.");
  sendResponse(res, 200, "Exam updated.", exam);
});
