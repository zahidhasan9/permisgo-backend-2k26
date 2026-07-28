import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(
  fs.readFileSync(path.join(__dirname, "driveQuizData.fixed.json"), "utf8"),
);

const SERIES_COUNT = 20;
const QUESTIONS_PER_SERIES = 10;
const validTopics = new Set(["L", "HAS", "C", "P", "R", "M", "U", "S", "D", "E"]);

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");
if (!Array.isArray(source.questions) || source.questions.length < QUESTIONS_PER_SERIES) {
  throw new Error("The source dataset does not contain enough valid questions.");
}

const normalizeQuestion = (item, quizId, order) => ({
  quiz: quizId,
  questionText: String(item.questionText || "").trim(),
  questionImage: item.questionImage || "",
  voiceText: item.voiceText || item.questionText || "",
  options: item.options.map((option, optionIndex) => ({
    text: String(option.text || "").trim(),
    image: option.image || "",
    order: optionIndex + 1,
  })),
  correctOptionIndex: Number(item.correctOptionIndex),
  explanationText: item.explanationText || "",
  explanationImage: item.explanationImage || "",
  markedAnswerImage: item.markedAnswerImage || "",
  topic: validTopics.has(item.topicCode) ? item.topicCode : "",
  difficulty: ["easy", "medium", "hard"].includes(item.difficulty)
    ? item.difficulty
    : "medium",
  order,
  status: "active",
});

const run = async () => {
  await mongoose.connect(mongoUri);

  try {
    let importedQuestions = 0;

    for (let seriesIndex = 0; seriesIndex < SERIES_COUNT; seriesIndex += 1) {
      const number = String(seriesIndex + 1).padStart(2, "0");
      const slug = `simple-series-${number}`;
      const quiz = await Quiz.findOneAndUpdate(
        { slug },
        {
          $set: {
            title: `Simple Series ${number}`,
            slug,
            type: "simple_series",
            description: `Driving code practice series ${number} with 10 questions.`,
            totalQuestions: QUESTIONS_PER_SERIES,
            durationMinutes: 15,
            passingScore: 60,
            isPaid: false,
            order: seriesIndex + 1,
            status: "active",
          },
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

      // These slugs are importer-owned. Replacing only their questions keeps
      // reruns deterministic while leaving every other quiz untouched.
      await Question.deleteMany({ quiz: quiz._id });

      const questions = Array.from({ length: QUESTIONS_PER_SERIES }, (_, offset) => {
        const sourceIndex =
          (seriesIndex * QUESTIONS_PER_SERIES + offset) % source.questions.length;
        return normalizeQuestion(source.questions[sourceIndex], quiz._id, offset + 1);
      });

      await Question.insertMany(questions);
      importedQuestions += questions.length;
    }

    const quizCount = await Quiz.countDocuments({
      slug: { $in: Array.from({ length: SERIES_COUNT }, (_, index) => `simple-series-${String(index + 1).padStart(2, "0")}`) },
      status: "active",
    });
    const importedQuizIds = await Quiz.find({
      slug: { $in: Array.from({ length: SERIES_COUNT }, (_, index) => `simple-series-${String(index + 1).padStart(2, "0")}`) },
    }).distinct("_id");
    const questionCount = await Question.countDocuments({
      quiz: { $in: importedQuizIds },
      status: "active",
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          quizzes: quizCount,
          questions: questionCount,
          importedQuestions,
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
