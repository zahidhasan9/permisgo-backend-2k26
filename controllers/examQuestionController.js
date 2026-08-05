import ExamQuestion from "../models/ExamQuestion.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import sendResponse from "../utils/ApiResponse.js";
import { deleteStoredFile, getUploadedFileUrl } from "../utils/uploadHelpers.js";

const fileFor = (req, field) => Array.isArray(req.files) ? req.files.find((file) => file.fieldname === field) : null;
const parseItems = (value) => {
  let items = value;
  if (typeof value === "string") {
    try { items = JSON.parse(value); } catch { throw new ApiError(400, "Question items must be valid JSON."); }
  }
  if (!Array.isArray(items)) throw new ApiError(400, "At least one question and answer is required.");
  const cleaned = items.map((item) => ({ question: String(item.question || "").trim(), answer: String(item.answer || "").trim() })).filter((item) => item.question && item.answer);
  if (!cleaned.length || cleaned.length > 20) throw new ApiError(400, "Provide between 1 and 20 complete question-answer pairs.");
  return cleaned;
};

export const getStudentExamQuestions = asyncHandler(async (req, res) => {
  const questions = await ExamQuestion.find({ status: "active" }).select("number title category image videoUrl items order").sort({ order: 1, number: 1 }).lean();
  sendResponse(res, 200, "Exam questions fetched.", questions);
});

export const getAdminExamQuestions = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const search = String(req.query.search || "").trim();
  const filter = search ? { $or: [{ title: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }, { category: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }] } : {};
  const [items, total] = await Promise.all([ExamQuestion.find(filter).sort({ order: 1, number: 1 }).skip((page - 1) * limit).limit(limit).lean(), ExamQuestion.countDocuments(filter)]);
  sendResponse(res, 200, "Exam questions fetched.", items, { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

export const getAdminExamQuestionById = asyncHandler(async (req, res) => {
  const question = await ExamQuestion.findById(req.params.id).lean();
  if (!question) throw new ApiError(404, "Exam question not found.");
  sendResponse(res, 200, "Exam question fetched.", question);
});

export const createExamQuestion = asyncHandler(async (req, res) => {
  const image = fileFor(req, "image");
  const videoUrl = String(req.body.videoUrl || "").trim();
  if ((!image && !videoUrl) || (image && videoUrl)) {
    throw new ApiError(400, "Choose exactly one question media: image or video.");
  }
  const question = await ExamQuestion.create({ number: Number(req.body.number), title: req.body.title || "", category: req.body.category || "General", image: image ? getUploadedFileUrl(image) : "", videoUrl, items: parseItems(req.body.items), order: Number(req.body.order) || 0, status: req.body.status || "active", createdBy: req.user._id });
  sendResponse(res, 201, "Exam question created.", question);
});

export const updateExamQuestion = asyncHandler(async (req, res) => {
  const question = await ExamQuestion.findById(req.params.id);
  if (!question) throw new ApiError(404, "Exam question not found.");
  const image = fileFor(req, "image");
  const oldImage = question.image;
  if (req.body.number !== undefined) question.number = Number(req.body.number);
  ["title", "category", "videoUrl", "status"].forEach((field) => { if (req.body[field] !== undefined) question[field] = req.body[field]; });
  if (req.body.order !== undefined) question.order = Number(req.body.order) || 0;
  if (req.body.items !== undefined) question.items = parseItems(req.body.items);
  if (image) question.image = getUploadedFileUrl(image);
  else if (req.body.removeImage === "true") question.image = "";
  if ((!question.image && !question.videoUrl) || (question.image && question.videoUrl)) {
    throw new ApiError(400, "Choose exactly one question media: image or video.");
  }
  await question.save();
  if (oldImage && oldImage !== question.image) await deleteStoredFile(oldImage);
  sendResponse(res, 200, "Exam question updated.", question);
});

export const deleteExamQuestion = asyncHandler(async (req, res) => {
  const question = await ExamQuestion.findById(req.params.id);
  if (!question) throw new ApiError(404, "Exam question not found.");
  if (question.image) await deleteStoredFile(question.image);
  await question.deleteOne();
  sendResponse(res, 200, "Exam question deleted.", { id: question._id });
});
