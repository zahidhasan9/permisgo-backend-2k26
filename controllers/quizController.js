import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import Question from "../models/Question.js";
import QuizAttempt from "../models/QuizAttempt.js";
import RoadSign from "../models/RoadSign.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import QuizRetakePermission from "../models/QuizRetakePermission.js";
import User from "../models/User.js";
import {
  getUploadedFileUrl,
  deleteStoredFile,
} from "../utils/uploadHelpers.js";

// ===============================Helper controller=======================
const getQuizDurationSeconds = (quiz) => {
  return Math.max(Number(quiz?.durationMinutes || 30), 1) * 60;
};

const getRemainingSeconds = (attempt, quiz) => {
  if (!attempt?.startedAt) return getQuizDurationSeconds(quiz);

  const durationSeconds = getQuizDurationSeconds(quiz);
  const startedAtMs = new Date(attempt.startedAt).getTime();
  const endAtMs = startedAtMs + durationSeconds * 1000;
  const remainingMs = endAtMs - Date.now();

  return Math.max(Math.ceil(remainingMs / 1000), 0);
};

const getAnsweredQuestionIds = (attempt) => {
  return (attempt?.answers || []).map((answer) => String(answer.question));
};

const getSelectedAnswersMap = (attempt) => {
  const selectedAnswers = {};

  (attempt?.answers || []).forEach((answer) => {
    selectedAnswers[String(answer.question)] = answer.selectedOptionIndex;
  });

  return selectedAnswers;
};

const getResumeIndex = (questions, attempt) => {
  const answeredSet = new Set(getAnsweredQuestionIds(attempt));

  const nextUnansweredIndex = questions.findIndex(
    (question) => !answeredSet.has(String(question._id)),
  );

  if (nextUnansweredIndex !== -1) return nextUnansweredIndex;

  return Math.max(questions.length - 1, 0);
};

const buildStudentAttemptPayload = ({
  attempt,
  quiz,
  questions,
  resumed = false,
  retakePermissionUsed = false,
}) => {
  return {
    attempt,
    quiz,
    questions: questions.map(sanitizeQuestionForStudent),
    answeredQuestionIds: getAnsweredQuestionIds(attempt),
    selectedAnswers: getSelectedAnswersMap(attempt),
    resumeIndex: getResumeIndex(questions, attempt),
    remainingSeconds: getRemainingSeconds(attempt, quiz),
    resumed,
    retakePermissionUsed,
  };
};

const finishAttemptByServer = async (attempt, quiz) => {
  if (!attempt || attempt.status !== "in_progress") return attempt;

  calculateAttemptResult(attempt, quiz);
  await attempt.save();

  return attempt;
};

const finishAttemptIfTimeExpired = async (attempt, quiz) => {
  if (!attempt || attempt.status !== "in_progress") return false;

  const remainingSeconds = getRemainingSeconds(attempt, quiz);

  if (remainingSeconds > 0) return false;

  await finishAttemptByServer(attempt, quiz);
  return true;
};

// ============================================helper====================================

const toPublicFilePath = (file) => {
  return getUploadedFileUrl(file);
};

const getFileByField = (req, fieldname) => {
  if (!Array.isArray(req.files)) return null;
  return req.files.find((file) => file.fieldname === fieldname) || null;
};

const parseJSON = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const sanitizeQuestionForStudent = (question) => ({
  _id: question._id,
  id: question._id,
  quiz: question.quiz,
  questionText: question.questionText,
  questionImage: question.questionImage,
  voiceText: question.voiceText,
  options: question.options.map((option, index) => ({
    text: option.text,
    image: option.image,
    order: option.order ?? index,
  })),
  topic: question.topic,
  difficulty: question.difficulty,
  order: question.order,
});

const normalizeOptionsFromRequest = (req, existingOptions = []) => {
  let options = parseJSON(req.body.options, null);

  if (!Array.isArray(options)) {
    options = [0, 1, 2, 3].map((index) => ({
      text:
        req.body[`option${index}`] ||
        req.body[`option${index + 1}`] ||
        existingOptions[index]?.text ||
        "",
      image: existingOptions[index]?.image || "",
      order: index,
    }));
  }

  options = options.slice(0, 4).map((option, index) => {
    const optionImageFile =
      getFileByField(req, `optionImage${index}`) ||
      getFileByField(req, `optionImage${index + 1}`);
    return {
      text: String(option?.text || "").trim(),
      image: optionImageFile
        ? toPublicFilePath(optionImageFile)
        : option?.image || existingOptions[index]?.image || "",
      order: Number.isFinite(Number(option?.order))
        ? Number(option.order)
        : index,
    };
  });

  while (options.length < 4) {
    options.push({ text: "", image: "", order: options.length });
  }

  if (options.some((option) => !option.text)) {
    const error = new Error("All 4 option text fields are required.");
    error.statusCode = 400;
    throw error;
  }

  return options;
};

const recalculateQuizTotal = async (quizId) => {
  const totalQuestions = await Question.countDocuments({
    quiz: quizId,
    status: "active",
  });
  await Quiz.findByIdAndUpdate(quizId, { totalQuestions });
  return totalQuestions;
};

const assertObjectId = (id, message = "Invalid id.") => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
};

const calculateAttemptResult = (attempt, quiz) => {
  const correctCount = attempt.answers.filter(
    (answer) => answer.isCorrect,
  ).length;
  const totalQuestions = attempt.totalQuestions || 0;
  const wrongCount = Math.max(totalQuestions - correctCount, 0);
  const percentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const now = new Date();

  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.score = correctCount;
  attempt.percentage = percentage;
  attempt.passed = percentage >= Number(quiz.passingScore || 60);
  attempt.status = "completed";
  attempt.finishedAt = now;
  attempt.durationSeconds = Math.max(
    Math.round((now - attempt.startedAt) / 1000),
    0,
  );
};

// =======================
// Public / Student Quiz
// =======================
export const getQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ status: "active" }).sort({
    order: 1,
    createdAt: -1,
  });
  sendResponse(res, 200, "Quizzes fetched.", quizzes);
});

export const getQuiz = asyncHandler(async (req, res) => {
  assertObjectId(req.params.quizId, "Invalid quiz id.");
  const quiz = await Quiz.findOne({
    _id: req.params.quizId,
    status: { $ne: "deleted" },
  });
  if (!quiz) {
    res.statusCode = 404;
    throw new Error("Quiz not found.");
  }
  sendResponse(res, 200, "Quiz fetched.", quiz);
});

export const getQuestions = asyncHandler(async (req, res) => {
  assertObjectId(req.params.quizId, "Invalid quiz id.");
  const questions = await Question.find({
    quiz: req.params.quizId,
    status: "active",
  }).sort({ order: 1, createdAt: 1 });
  sendResponse(
    res,
    200,
    "Questions fetched.",
    questions.map(sanitizeQuestionForStudent),
  );
});

export const startQuizAttempt = asyncHandler(async (req, res) => {
  assertObjectId(req.params.quizId, "Invalid quiz id.");

  const quiz = await Quiz.findOne({
    _id: req.params.quizId,
    status: "active",
  });

  if (!quiz) {
    res.statusCode = 404;
    throw new Error("Active quiz not found.");
  }

  const questions = await Question.find({
    quiz: quiz._id,
    status: "active",
  }).sort({ order: 1, createdAt: 1 });

  if (!questions.length) {
    res.statusCode = 400;
    throw new Error("This quiz has no active questions.");
  }

  const existingInProgressAttempt = await QuizAttempt.findOne({
    student: req.user._id,
    quiz: quiz._id,
    status: "in_progress",
  }).sort({ createdAt: -1 });

  if (existingInProgressAttempt) {
    const timeExpired = await finishAttemptIfTimeExpired(
      existingInProgressAttempt,
      quiz,
    );

    const allQuestionsAnswered =
      existingInProgressAttempt.answers.length >= questions.length;

    if (!timeExpired && allQuestionsAnswered) {
      await finishAttemptByServer(existingInProgressAttempt, quiz);
    }

    if (!timeExpired && !allQuestionsAnswered) {
      return sendResponse(res, 200, "Existing quiz attempt resumed.", {
        ...buildStudentAttemptPayload({
          attempt: existingInProgressAttempt,
          quiz,
          questions,
          resumed: true,
        }),
      });
    }
  }

  const latestCompletedAttempt = await QuizAttempt.findOne({
    student: req.user._id,
    quiz: quiz._id,
    status: "completed",
  }).sort({ finishedAt: -1, createdAt: -1 });

  let activeRetakePermission = null;

  if (latestCompletedAttempt) {
    activeRetakePermission = await QuizRetakePermission.findOne({
      student: req.user._id,
      quiz: quiz._id,
      status: "active",
    }).sort({ createdAt: -1 });

    if (!activeRetakePermission) {
      return sendResponse(
        res,
        409,
        "Quiz time is over or this quiz is already completed. Please contact admin to allow retake.",
        {
          retakeLocked: true,
          timeExpired: true,
          latestAttempt: latestCompletedAttempt,
          quiz,
        },
      );
    }
  }

  const attempt = await QuizAttempt.create({
    student: req.user._id,
    quiz: quiz._id,
    totalQuestions: questions.length,
    startedAt: new Date(),
    status: "in_progress",
  });

  if (activeRetakePermission) {
    activeRetakePermission.status = "used";
    activeRetakePermission.usedAttempt = attempt._id;
    activeRetakePermission.usedAt = new Date();
    await activeRetakePermission.save();
  }

  sendResponse(res, 201, "Quiz attempt started.", {
    ...buildStudentAttemptPayload({
      attempt,
      quiz,
      questions,
      resumed: false,
      retakePermissionUsed: Boolean(activeRetakePermission),
    }),
  });
});

export const submitQuizAnswer = asyncHandler(async (req, res) => {
  assertObjectId(req.params.attemptId, "Invalid attempt id.");

  const { questionId, selectedOptionIndex, timeSpentSeconds = 0 } = req.body;
  assertObjectId(questionId, "Invalid question id.");

  const selectedIndex = toNumber(selectedOptionIndex, -1);
  if (selectedIndex < 0 || selectedIndex > 3) {
    res.statusCode = 400;
    throw new Error("Selected option index must be between 0 and 3.");
  }

  const attempt = await QuizAttempt.findOne({
    _id: req.params.attemptId,
    student: req.user._id,
  });
  if (!attempt) {
    res.statusCode = 404;
    throw new Error("Attempt not found.");
  }
  if (attempt.status !== "in_progress") {
    res.statusCode = 400;
    throw new Error("This attempt is already finished.");
  }

  const question = await Question.findOne({
    _id: questionId,
    quiz: attempt.quiz,
    status: "active",
  });
  if (!question) {
    res.statusCode = 404;
    throw new Error("Question not found in this quiz.");
  }

  const existingAnswer = attempt.answers.find(
    (answer) => String(answer.question) === String(question._id),
  );
  const isCorrect = selectedIndex === question.correctOptionIndex;

  if (!existingAnswer) {
    attempt.answers.push({
      question: question._id,
      selectedOptionIndex: selectedIndex,
      correctOptionIndex: question.correctOptionIndex,
      isCorrect,
      timeSpentSeconds: toNumber(timeSpentSeconds, 0),
    });
    attempt.correctCount = attempt.answers.filter(
      (answer) => answer.isCorrect,
    ).length;
    attempt.wrongCount = attempt.answers.length - attempt.correctCount;
    attempt.score = attempt.correctCount;
    attempt.percentage =
      attempt.totalQuestions > 0
        ? Math.round((attempt.correctCount / attempt.totalQuestions) * 100)
        : 0;
    await attempt.save();
  }

  sendResponse(res, 200, "Answer checked.", {
    questionId: question._id,
    selectedOptionIndex: existingAnswer?.selectedOptionIndex ?? selectedIndex,
    correctOptionIndex: question.correctOptionIndex,
    isCorrect: existingAnswer?.isCorrect ?? isCorrect,
    explanationText: question.explanationText,
    explanationImage: question.explanationImage,
    markedAnswerImage: question.markedAnswerImage,
    answeredCount: attempt.answers.length,
    totalQuestions: attempt.totalQuestions,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
  });
});

export const finishQuizAttempt = asyncHandler(async (req, res) => {
  assertObjectId(req.params.attemptId, "Invalid attempt id.");

  const attempt = await QuizAttempt.findOne({
    _id: req.params.attemptId,
    student: req.user._id,
  });
  if (!attempt) {
    res.statusCode = 404;
    throw new Error("Attempt not found.");
  }

  const quiz = await Quiz.findById(attempt.quiz);
  if (!quiz) {
    res.statusCode = 404;
    throw new Error("Quiz not found.");
  }

  if (attempt.status !== "completed") {
    calculateAttemptResult(attempt, quiz);
    await attempt.save();
  }

  sendResponse(res, 200, "Quiz attempt finished.", attempt);
});

export const getMyQuizAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ student: req.user._id })
    .populate("quiz", "title type coverImage passingScore durationMinutes")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "My quiz attempts fetched.", attempts);
});

export const getQuizAttemptReview = asyncHandler(async (req, res) => {
  assertObjectId(req.params.attemptId, "Invalid attempt id.");

  const filter = { _id: req.params.attemptId };
  if (req.user.role !== "admin") filter.student = req.user._id;

  const attempt = await QuizAttempt.findOne(filter)
    .populate("quiz", "title type passingScore durationMinutes")
    .populate("student", "name email role")
    .populate("answers.question");

  if (!attempt) {
    res.statusCode = 404;
    throw new Error("Attempt review not found.");
  }

  const review = {
    _id: attempt._id,
    student: attempt.student,
    quiz: attempt.quiz,
    totalQuestions: attempt.totalQuestions,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
    score: attempt.score,
    percentage: attempt.percentage,
    passed: attempt.passed,
    status: attempt.status,
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
    durationSeconds: attempt.durationSeconds,
    answers: attempt.answers.map((answer) => ({
      question: answer.question,
      selectedOptionIndex: answer.selectedOptionIndex,
      correctOptionIndex: answer.correctOptionIndex,
      isCorrect: answer.isCorrect,
      timeSpentSeconds: answer.timeSpentSeconds,
      answeredAt: answer.answeredAt,
    })),
  };

  sendResponse(res, 200, "Attempt review fetched.", review);
});

// =======================
// Admin Quiz Management
// =======================
export const getAdminQuizzes = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const { search, type, status, isPaid } = req.query;

  const filter = {
    status: { $ne: "deleted" },
  };

  if (status && status !== "all") {
    filter.status = status;
  }

  if (type && type !== "all") {
    filter.type = type;
  }

  if (isPaid === "true") {
    filter.isPaid = true;
  }

  if (isPaid === "false") {
    filter.isPaid = false;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");

    filter.$or = [
      { title: regex },
      { slug: regex },
      { description: regex },
      { type: regex },
    ];
  }

  const [quizzes, total] = await Promise.all([
    Quiz.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Quiz.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Admin quizzes fetched.", {
    quizzes,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
});

export const getAdminQuizStats = asyncHandler(async (req, res) => {
  const [
    totalQuizzes,
    activeQuizzes,
    inactiveQuizzes,
    paidQuizzes,
    freeQuizzes,
    totalQuestions,
    activeQuestions,
    totalAttempts,
    completedAttempts,
    passedAttempts,
    averageScoreResult,
    quizzesByType,
  ] = await Promise.all([
    Quiz.countDocuments({ status: { $ne: "deleted" } }),
    Quiz.countDocuments({ status: "active" }),
    Quiz.countDocuments({ status: "inactive" }),
    Quiz.countDocuments({ status: { $ne: "deleted" }, isPaid: true }),
    Quiz.countDocuments({ status: { $ne: "deleted" }, isPaid: false }),

    Question.countDocuments({ status: { $ne: "deleted" } }),
    Question.countDocuments({ status: "active" }),

    QuizAttempt.countDocuments({}),
    QuizAttempt.countDocuments({ status: "completed" }),
    QuizAttempt.countDocuments({ status: "completed", passed: true }),

    QuizAttempt.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: "$percentage" },
        },
      },
    ]),

    Quiz.aggregate([
      { $match: { status: { $ne: "deleted" } } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  const failedAttempts = Math.max(completedAttempts - passedAttempts, 0);

  sendResponse(res, 200, "Admin quiz stats fetched.", {
    totalQuizzes,
    activeQuizzes,
    inactiveQuizzes,
    paidQuizzes,
    freeQuizzes,
    totalQuestions,
    activeQuestions,
    totalAttempts,
    completedAttempts,
    passedAttempts,
    failedAttempts,
    averageScore: Math.round(averageScoreResult?.[0]?.averageScore || 0),
    quizzesByType,
  });
});

export const createQuiz = asyncHandler(async (req, res) => {
  const coverImageFile = getFileByField(req, "coverImage");

  const coverImage = coverImageFile
    ? getUploadedFileUrl(coverImageFile)
    : req.body.coverImage || "";

  const quiz = await Quiz.create({
    title: req.body.title,
    slug: req.body.slug,
    type: req.body.type || "simple_series",
    description: req.body.description || "",
    coverImage,
    durationMinutes: toNumber(req.body.durationMinutes, 30),
    passingScore: toNumber(req.body.passingScore, 60),
    isPaid: req.body.isPaid === "true" || req.body.isPaid === true,
    order: toNumber(req.body.order, 0),
    status: req.body.status || "active",
    createdBy: req.user?._id,
  });

  sendResponse(res, 201, "Quiz created.", quiz);
});

export const updateQuiz = asyncHandler(async (req, res) => {
  assertObjectId(req.params.quizId, "Invalid quiz id.");

  const quiz = await Quiz.findById(req.params.quizId);

  if (!quiz || quiz.status === "deleted") {
    res.statusCode = 404;
    throw new Error("Quiz not found.");
  }

  const coverImageFile = getFileByField(req, "coverImage");

  const oldCoverImage = quiz.coverImage || "";

  const allowedFields = ["title", "slug", "type", "description", "status"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      quiz[field] = req.body[field];
    }
  });

  if (req.body.durationMinutes !== undefined) {
    quiz.durationMinutes = toNumber(
      req.body.durationMinutes,
      quiz.durationMinutes,
    );
  }

  if (req.body.passingScore !== undefined) {
    quiz.passingScore = toNumber(req.body.passingScore, quiz.passingScore);
  }

  if (req.body.order !== undefined) {
    quiz.order = toNumber(req.body.order, quiz.order);
  }

  if (req.body.isPaid !== undefined) {
    quiz.isPaid = req.body.isPaid === "true" || req.body.isPaid === true;
  }

  if (coverImageFile) {
    const newCoverImage = getUploadedFileUrl(coverImageFile);

    if (!newCoverImage) {
      res.statusCode = 500;
      throw new Error("Uploaded cover image URL could not be created.");
    }

    quiz.coverImage = newCoverImage;
  }

  await quiz.save();
  if (coverImageFile && oldCoverImage && oldCoverImage !== quiz.coverImage) {
    await deleteStoredFile(oldCoverImage);
  }

  sendResponse(res, 200, "Quiz updated.", quiz);
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  assertObjectId(req.params.quizId, "Invalid quiz id.");
  const quiz = await Quiz.findById(req.params.quizId);
  if (!quiz) {
    res.statusCode = 404;
    throw new Error("Quiz not found.");
  }

  quiz.status = "deleted";
  await quiz.save();
  await Question.updateMany({ quiz: quiz._id }, { status: "deleted" });

  sendResponse(res, 200, "Quiz deleted.", quiz);
});

export const getAdminQuestions = asyncHandler(async (req, res) => {
  assertObjectId(req.params.quizId, "Invalid quiz id.");
  const questions = await Question.find({
    quiz: req.params.quizId,
    status: { $ne: "deleted" },
  }).sort({ order: 1, createdAt: 1 });
  sendResponse(res, 200, "Admin questions fetched.", questions);
});

export const getQuestionById = asyncHandler(async (req, res) => {
  assertObjectId(req.params.questionId, "Invalid question id.");
  const question = await Question.findOne({
    _id: req.params.questionId,
    status: { $ne: "deleted" },
  });
  if (!question) {
    res.statusCode = 404;
    throw new Error("Question not found.");
  }
  sendResponse(res, 200, "Question fetched.", question);
});

export const createQuestion = asyncHandler(async (req, res) => {
  assertObjectId(req.params.quizId, "Invalid quiz id.");

  const quiz = await Quiz.findOne({
    _id: req.params.quizId,
    status: { $ne: "deleted" },
  });
  if (!quiz) {
    res.statusCode = 404;
    throw new Error("Quiz not found.");
  }

  const questionImageFile = getFileByField(req, "questionImage");
  const explanationImageFile = getFileByField(req, "explanationImage");
  const markedAnswerImageFile = getFileByField(req, "markedAnswerImage");
  const options = normalizeOptionsFromRequest(req);

  const question = await Question.create({
    quiz: quiz._id,
    questionText: req.body.questionText,
    questionImage: questionImageFile
      ? toPublicFilePath(questionImageFile)
      : req.body.questionImage || "",
    voiceText: req.body.voiceText || "",
    options,
    correctOptionIndex: toNumber(req.body.correctOptionIndex, 0),
    explanationText: req.body.explanationText || "",
    explanationImage: explanationImageFile
      ? toPublicFilePath(explanationImageFile)
      : req.body.explanationImage || "",
    markedAnswerImage: markedAnswerImageFile
      ? toPublicFilePath(markedAnswerImageFile)
      : req.body.markedAnswerImage || "",
    topic: req.body.topic || "",
    difficulty: req.body.difficulty || "medium",
    order: toNumber(req.body.order, 0),
    status: req.body.status || "active",
  });

  await recalculateQuizTotal(quiz._id);
  sendResponse(res, 201, "Question created.", question);
});

export const updateQuestion = asyncHandler(async (req, res) => {
  assertObjectId(req.params.questionId, "Invalid question id.");

  const question = await Question.findOne({
    _id: req.params.questionId,
    status: { $ne: "deleted" },
  });
  if (!question) {
    res.statusCode = 404;
    throw new Error("Question not found.");
  }

  const questionImageFile = getFileByField(req, "questionImage");
  const explanationImageFile = getFileByField(req, "explanationImage");
  const markedAnswerImageFile = getFileByField(req, "markedAnswerImage");

  if (req.body.questionText !== undefined)
    question.questionText = req.body.questionText;
  if (req.body.voiceText !== undefined) question.voiceText = req.body.voiceText;
  if (req.body.correctOptionIndex !== undefined)
    question.correctOptionIndex = toNumber(
      req.body.correctOptionIndex,
      question.correctOptionIndex,
    );
  if (req.body.explanationText !== undefined)
    question.explanationText = req.body.explanationText;
  if (req.body.topic !== undefined) question.topic = req.body.topic;
  if (req.body.difficulty !== undefined)
    question.difficulty = req.body.difficulty;
  if (req.body.order !== undefined)
    question.order = toNumber(req.body.order, question.order);
  if (req.body.status !== undefined) question.status = req.body.status;

  if (questionImageFile)
    question.questionImage = toPublicFilePath(questionImageFile);
  if (explanationImageFile)
    question.explanationImage = toPublicFilePath(explanationImageFile);
  if (markedAnswerImageFile)
    question.markedAnswerImage = toPublicFilePath(markedAnswerImageFile);

  if (
    req.body.options !== undefined ||
    req.body.option0 !== undefined ||
    req.body.option1 !== undefined
  ) {
    question.options = normalizeOptionsFromRequest(req, question.options);
  }

  await question.save();
  await recalculateQuizTotal(question.quiz);
  sendResponse(res, 200, "Question updated.", question);
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  assertObjectId(req.params.questionId, "Invalid question id.");

  const question = await Question.findById(req.params.questionId);
  if (!question) {
    res.statusCode = 404;
    throw new Error("Question not found.");
  }

  question.status = "deleted";
  await question.save();
  await recalculateQuizTotal(question.quiz);

  sendResponse(res, 200, "Question deleted.", question);
});

export const getAdminAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({})
    .populate("student", "name email role")
    .populate("quiz", "title type")
    .sort({ createdAt: -1 })
    .limit(200);

  sendResponse(res, 200, "Admin attempts fetched.", attempts);
});

export const grantQuizRetakePermission = asyncHandler(async (req, res) => {
  const { studentId, quizId, attemptId, reason = "" } = req.body;

  assertObjectId(studentId, "Invalid student id.");
  assertObjectId(quizId, "Invalid quiz id.");

  if (attemptId) {
    assertObjectId(attemptId, "Invalid attempt id.");
  }

  const student = await User.findOne({
    _id: studentId,
    role: "student",
    status: { $ne: "blocked" },
  });

  if (!student) {
    res.statusCode = 404;
    throw new Error("Student not found.");
  }

  const quiz = await Quiz.findOne({
    _id: quizId,
    status: { $ne: "deleted" },
  });

  if (!quiz) {
    res.statusCode = 404;
    throw new Error("Quiz not found.");
  }

  if (attemptId) {
    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      student: studentId,
      quiz: quizId,
    });

    if (!attempt) {
      res.statusCode = 404;
      throw new Error("Attempt not found for this student and quiz.");
    }
  }

  const existingActivePermission = await QuizRetakePermission.findOne({
    student: studentId,
    quiz: quizId,
    status: "active",
  })
    .populate("student", "name email phone role")
    .populate("quiz", "title type passingScore durationMinutes")
    .populate("allowedBy", "name email role");

  if (existingActivePermission) {
    return sendResponse(
      res,
      200,
      "Retake permission is already active for this student.",
      existingActivePermission,
    );
  }

  const permission = await QuizRetakePermission.create({
    student: studentId,
    quiz: quizId,
    attempt: attemptId || null,
    allowedBy: req.user._id,
    reason,
    status: "active",
  });

  const populatedPermission = await QuizRetakePermission.findById(
    permission._id,
  )
    .populate("student", "name email phone role")
    .populate("quiz", "title type passingScore durationMinutes")
    .populate("attempt")
    .populate("allowedBy", "name email role");

  sendResponse(
    res,
    201,
    "Retake permission enabled successfully.",
    populatedPermission,
  );
});

export const getAdminRetakePermissions = asyncHandler(async (req, res) => {
  const { status = "all" } = req.query;

  const filter = {};
  if (status !== "all") {
    filter.status = status;
  }

  const permissions = await QuizRetakePermission.find(filter)
    .populate("student", "name email phone role")
    .populate("quiz", "title type passingScore durationMinutes")
    .populate("attempt")
    .populate("usedAttempt")
    .populate("allowedBy", "name email role")
    .populate("revokedBy", "name email role")
    .sort({ createdAt: -1 })
    .limit(300);

  sendResponse(res, 200, "Retake permissions fetched.", permissions);
});

export const getMyRetakePermissions = asyncHandler(async (req, res) => {
  const permissions = await QuizRetakePermission.find({
    student: req.user._id,
    status: "active",
  })
    .populate("quiz", "title type coverImage passingScore durationMinutes")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, "My active retake permissions fetched.", permissions);
});

export const revokeQuizRetakePermission = asyncHandler(async (req, res) => {
  assertObjectId(req.params.permissionId, "Invalid permission id.");

  const permission = await QuizRetakePermission.findById(
    req.params.permissionId,
  );

  if (!permission) {
    res.statusCode = 404;
    throw new Error("Retake permission not found.");
  }

  if (permission.status !== "active") {
    return sendResponse(
      res,
      400,
      "Only active retake permission can be revoked.",
      permission,
    );
  }

  permission.status = "revoked";
  permission.revokedBy = req.user._id;
  permission.revokedAt = new Date();

  await permission.save();

  const populatedPermission = await QuizRetakePermission.findById(
    permission._id,
  )
    .populate("student", "name email phone role")
    .populate("quiz", "title type passingScore durationMinutes")
    .populate("allowedBy", "name email role")
    .populate("revokedBy", "name email role");

  sendResponse(
    res,
    200,
    "Retake permission revoked successfully.",
    populatedPermission,
  );
});

// =======================
// Existing Road Signs
// =======================
export const getRoadSigns = asyncHandler(async (req, res) => {
  const signs = await RoadSign.find({ status: "active" });
  sendResponse(res, 200, "Road signs fetched.", signs);
});

export const createRoadSign = asyncHandler(async (req, res) => {
  const imageFile = getFileByField(req, "image");
  const sign = await RoadSign.create({
    title: req.body.title,
    image: imageFile ? toPublicFilePath(imageFile) : req.body.image || "",
    category: req.body.category || "",
    description: req.body.description || "",
    status: req.body.status || "active",
  });
  sendResponse(res, 201, "Road sign created.", sign);
});

export default {
  getQuizzes,
  getQuiz,
  getQuestions,
  startQuizAttempt,
  submitQuizAnswer,
  finishQuizAttempt,
  getMyQuizAttempts,
  getQuizAttemptReview,
  getAdminQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getAdminQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getAdminAttempts,
  getRoadSigns,
  createRoadSign,
  getAdminQuizStats,
  grantQuizRetakePermission,
  getAdminRetakePermissions,
  getMyRetakePermissions,
  revokeQuizRetakePermission,
};
