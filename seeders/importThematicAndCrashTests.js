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
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const themes = [
  ["L", "Legal provisions regarding road traffic"],
  ["HAS", "First aid"],
  ["C", "The Driver"],
  ["P", "Precautions to take when leaving the vehicle"],
  ["R", "The Road"],
  ["M", "Mechanical components and safety equipment"],
  ["U", "Other road users"],
  ["S", "Vehicle safety equipment"],
  ["D", "General regulations and miscellaneous"],
  ["E", "Rules for using the vehicle in relation to ecology"],
];

const normalizeQuestion = (item, quizId, order, topic = item.topicCode || "") => ({
  quiz: quizId,
  questionText: String(item.questionText || "").trim(),
  questionImage: item.questionImage || "",
  voiceText: item.voiceText || item.questionText || "",
  options: item.options.map((option, index) => ({
    text: String(option.text || "").trim(),
    image: option.image || "",
    order: index + 1,
  })),
  correctOptionIndex: Number(item.correctOptionIndex),
  explanationText: item.explanationText || "",
  explanationImage: item.explanationImage || "",
  markedAnswerImage: item.markedAnswerImage || "",
  topic,
  difficulty: ["easy", "medium", "hard"].includes(item.difficulty)
    ? item.difficulty
    : "medium",
  order,
  status: "active",
});

const upsertQuiz = (slug, data) =>
  Quiz.findOneAndUpdate(
    { slug },
    { $set: { slug, status: "active", isPaid: false, ...data } },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

const replaceQuestions = async (quiz, items) => {
  await Question.deleteMany({ quiz: quiz._id });
  await Question.insertMany(items);
};

const run = async () => {
  await mongoose.connect(mongoUri);

  try {
    const allQuestions = source.questions;

    for (let themeIndex = 0; themeIndex < themes.length; themeIndex += 1) {
      const [code, title] = themes[themeIndex];
      const slug = `thematic-series-${code.toLowerCase()}`;
      const quiz = await upsertQuiz(slug, {
        title,
        type: "thematic_series",
        description: `${title} thematic practice series.`,
        totalQuestions: 10,
        durationMinutes: 15,
        passingScore: 60,
        order: themeIndex + 1,
      });

      const sameTopic = allQuestions.filter((item) => item.topicCode === code);
      const pool = sameTopic.length ? sameTopic : allQuestions;
      const questions = Array.from({ length: 10 }, (_, offset) => {
        const item = pool[(themeIndex * 10 + offset) % pool.length];
        return normalizeQuestion(item, quiz._id, offset + 1, code);
      });
      await replaceQuestions(quiz, questions);
    }

    const crashQuiz = await upsertQuiz("crash-test-main", {
      title: "Crash Test",
      type: "crash_test",
      description: "A complete 40-question driving code simulation.",
      totalQuestions: 40,
      durationMinutes: 35,
      passingScore: 70,
      order: 1,
    });
    const crashQuestions = Array.from({ length: 40 }, (_, index) =>
      normalizeQuestion(
        allQuestions[index % allQuestions.length],
        crashQuiz._id,
        index + 1,
      ),
    );
    await replaceQuestions(crashQuiz, crashQuestions);

    const thematicIds = await Quiz.find({
      slug: { $in: themes.map(([code]) => `thematic-series-${code.toLowerCase()}`) },
    }).distinct("_id");
    const thematicQuestionCount = await Question.countDocuments({
      quiz: { $in: thematicIds },
      status: "active",
    });
    const crashQuestionCount = await Question.countDocuments({
      quiz: crashQuiz._id,
      status: "active",
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          thematicSeries: thematicIds.length,
          thematicQuestions: thematicQuestionCount,
          crashTests: 1,
          crashQuestions: crashQuestionCount,
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
