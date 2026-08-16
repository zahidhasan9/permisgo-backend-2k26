import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetDirectory = path.resolve(__dirname, "../assets/simple-series-hq");
const sourceFiles = Array.from(
  { length: 9 },
  (_, index) => `road-${String(index + 1).padStart(2, "0")}.png`,
);

const cloudinaryFolder = [
  String(process.env.CLOUDINARY_FOLDER || "permisgo").replace(/^\/|\/$/g, ""),
  "thematic-series",
]
  .filter(Boolean)
  .join("/");

const run = async () => {
  const imageUrls = [];
  for (let index = 0; index < sourceFiles.length; index += 1) {
    const upload = await cloudinary.uploader.upload(
      path.join(assetDirectory, sourceFiles[index]),
      {
        public_id: `${cloudinaryFolder}/road-${String(index + 1).padStart(2, "0")}`,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      },
    );
    imageUrls.push(upload.secure_url);
  }

  await mongoose.connect(mongoUri);
  try {
    const quizzes = await Quiz.find({
      type: "thematic_series",
      status: "active",
    }).sort({ order: 1, createdAt: 1 });

    let updatedQuestions = 0;
    for (let quizIndex = 0; quizIndex < quizzes.length; quizIndex += 1) {
      const quiz = quizzes[quizIndex];
      quiz.coverImage = imageUrls[(quizIndex + 3) % imageUrls.length];
      await quiz.save();

      const questions = await Question.find({
        quiz: quiz._id,
        status: "active",
      }).sort({ order: 1, createdAt: 1 });

      for (
        let questionIndex = 0;
        questionIndex < questions.length;
        questionIndex += 1
      ) {
        const imageIndex =
          (quizIndex * 2 + questionIndex + 3) % imageUrls.length;
        const question = questions[questionIndex];
        question.questionImage = imageUrls[imageIndex];
        question.markedAnswerImage =
          imageUrls[(imageIndex + 1) % imageUrls.length];
        question.explanationImage =
          imageUrls[(imageIndex + 2) % imageUrls.length];
        await question.save();
        updatedQuestions += 1;
      }
    }

    console.log(
      JSON.stringify(
        {
          success: true,
          uploadedImages: imageUrls.length,
          updatedQuizzes: quizzes.length,
          updatedQuestions,
          imageUrls,
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
