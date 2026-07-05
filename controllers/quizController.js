import Quiz from "../models/Quiz";
import Question from "../models/Question";
import RoadSign from "../models/RoadSign";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";

export const getQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ status: "active" });
  sendResponse(res, 200, "Quizzes fetched.", quizzes);
});

export const createQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.create(req.body);
  sendResponse(res, 201, "Quiz created.", quiz);
});

export const getQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find({ quiz: req.params.quizId });
  sendResponse(res, 200, "Questions fetched.", questions);
});

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await Question.create(req.body);
  sendResponse(res, 201, "Question created.", question);
});

export const getRoadSigns = asyncHandler(async (req, res) => {
  const signs = await RoadSign.find({ status: "active" });
  sendResponse(res, 200, "Road signs fetched.", signs);
});

export const createRoadSign = asyncHandler(async (req, res) => {
  const sign = await RoadSign.create(req.body);
  sendResponse(res, 201, "Road sign created.", sign);
});
