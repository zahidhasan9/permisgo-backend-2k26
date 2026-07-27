/*
  Seed driving quiz, learning content, and questions.

  Put this file in: backend/seed/insertDriveQuizData.js
  Put JSON file in: backend/seed/driveQuizData.fixed.json

  Run from backend folder:
    node seed/insertDriveQuizData.js
*/

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

try {
  require("dotenv").config();
} catch (_) {}

function loadModel(modelName, candidates) {
  const errors = [];

  for (const candidate of candidates) {
    try {
      const loaded = require(candidate);
      return loaded.default || loaded;
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`);
    }
  }

  throw new Error(
    `Could not load ${modelName} model. Please edit model paths in this seed file.\n` +
      errors.join("\n"),
  );
}

/*
  If your backend model paths are different, edit only these candidate lists.
*/
const Quiz = loadModel("Quiz", [
  "../models/Quiz",
  "../models/quiz",
  "../models/quiz.model",
  "../models/quizModel",
  "../src/models/Quiz",
  "../src/models/quiz",
  "../src/models/quiz.model",
  "../src/models/quizModel",
]);

const Question = loadModel("Question", [
  "../models/Question",
  "../models/question",
  "../models/question.model",
  "../models/questionModel",
  "../src/models/Question",
  "../src/models/question",
  "../src/models/question.model",
  "../src/models/questionModel",
]);

const LearningContent = loadModel("LearningContent", [
  "../models/LearningContent",
  "../models/learningContent",
  "../models/learningContent.model",
  "../models/learningContentModel",
  "../src/models/LearningContent",
  "../src/models/learningContent",
  "../src/models/learningContent.model",
  "../src/models/learningContentModel",
]);

const jsonPath = path.join(__dirname, "driveQuizData.fixed.json");
const raw = fs.readFileSync(jsonPath, "utf8");
const seedData = JSON.parse(raw);

function requiredEnv() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.DB_URL;

  if (!uri) {
    throw new Error(
      "MongoDB connection string not found. Add MONGO_URI in backend .env file.",
    );
  }

  return uri;
}

function validateSeedData(data) {
  if (!Array.isArray(data.quizzes)) {
    throw new Error("quizzes must be an array.");
  }

  if (!Array.isArray(data.learningContents)) {
    throw new Error("learningContents must be an array.");
  }

  if (!Array.isArray(data.questions)) {
    throw new Error("questions must be an array.");
  }

  const quizSlugs = new Set(data.quizzes.map((quiz) => quiz.slug));

  for (const question of data.questions) {
    if (!quizSlugs.has(question.quizSlug)) {
      throw new Error(`Quiz slug not found for question: ${question.quizSlug}`);
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(
        `Question must have exactly 4 options: ${question.questionText}`,
      );
    }

    if (![0, 1, 2, 3].includes(question.correctOptionIndex)) {
      throw new Error(
        `Invalid correctOptionIndex for question: ${question.questionText}`,
      );
    }
  }

  for (const content of data.learningContents) {
    if (content.relatedQuizSlug && !quizSlugs.has(content.relatedQuizSlug)) {
      throw new Error(
        `relatedQuizSlug not found for learning content: ${content.title}`,
      );
    }
  }
}

async function seedDriveQuizData() {
  validateSeedData(seedData);

  await mongoose.connect(requiredEnv());
  console.log("✅ MongoDB connected");

  const quizMap = {};

  // 1. Insert or update quizzes
  for (const quiz of seedData.quizzes) {
    const savedQuiz = await Quiz.findOneAndUpdate(
      { slug: quiz.slug },
      {
        title: quiz.title,
        slug: quiz.slug,
        type: quiz.type,
        description: quiz.description || "",
        durationMinutes: quiz.durationMinutes || 20,
        totalMarks: quiz.totalMarks || 0,
        passPercentage: quiz.passPercentage || 60,
        status: quiz.status || "published",
        coverImage: quiz.coverImage || "",
        instructions: quiz.instructions || "",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    quizMap[quiz.slug] = savedQuiz._id;
  }

  console.log(`✅ Quizzes inserted/updated: ${Object.keys(quizMap).length}`);

  // 2. Insert or update learning contents
  let learningCount = 0;

  for (const content of seedData.learningContents) {
    await LearningContent.findOneAndUpdate(
      {
        title: content.title,
        type: content.type,
      },
      {
        type: content.type,
        contentKind: content.contentKind || "",
        title: content.title,
        subtitle: content.subtitle || "",
        description: content.description || "",
        category: content.category || "",
        topicCode: content.topicCode || "",
        image: content.image || "",
        videoUrl: content.videoUrl || "",
        content: content.content || "",
        relatedQuiz: quizMap[content.relatedQuizSlug] || null,
        status: content.status || "published",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    learningCount += 1;
  }

  console.log(`✅ Learning contents inserted/updated: ${learningCount}`);

  // 3. Insert or update questions
  let questionCount = 0;

  for (const question of seedData.questions) {
    const quizId = quizMap[question.quizSlug];

    await Question.findOneAndUpdate(
      {
        quiz: quizId,
        questionText: question.questionText,
      },
      {
        quiz: quizId,
        topic: question.topic || "",
        topicCode: question.topicCode || "",
        questionText: question.questionText,
        questionImage: question.questionImage || "",
        options: question.options.map((option) => ({
          text: option.text || "",
          image: option.image || "",
        })),
        correctOptionIndex: question.correctOptionIndex,
        explanationText: question.explanationText || "",
        explanationImage: question.explanationImage || "",
        difficulty: question.difficulty || "easy",
        marks: question.marks || 1,
        status: question.status || "published",
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    questionCount += 1;
  }

  console.log(`✅ Questions inserted/updated: ${questionCount}`);
  console.log("🎉 Seed completed successfully");

  await mongoose.disconnect();
  process.exit(0);
}

seedDriveQuizData().catch(async (error) => {
  console.error("❌ Seed failed:");
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch (_) {}

  process.exit(1);
});
