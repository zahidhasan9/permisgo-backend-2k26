import "dotenv/config";
import mongoose from "mongoose";

import Question from "../models/Question.js";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const run = async () => {
  await mongoose.connect(mongoUri);
  try {
    const result = await Question.updateMany(
      {
        status: "active",
        questionImage: /^https:\/\/res\.cloudinary\.com\//,
      },
      [
        {
          $set: {
            explanationImage: "$questionImage",
            markedAnswerImage: "$questionImage",
          },
        },
      ],
      { updatePipeline: true },
    );

    const [activeQuestions, answerImages, missingAnswerImages] =
      await Promise.all([
        Question.countDocuments({ status: "active" }),
        Question.countDocuments({
          status: "active",
          explanationImage: /^https:\/\/res\.cloudinary\.com\//,
          markedAnswerImage: /^https:\/\/res\.cloudinary\.com\//,
        }),
        Question.countDocuments({
          status: "active",
          $or: [
            { explanationImage: "" },
            { explanationImage: null },
            { explanationImage: { $exists: false } },
            { markedAnswerImage: "" },
            { markedAnswerImage: null },
            { markedAnswerImage: { $exists: false } },
          ],
        }),
      ]);

    console.log(
      JSON.stringify(
        {
          success: true,
          matched: result.matchedCount,
          modified: result.modifiedCount,
          activeQuestions,
          questionsWithCorrectAnswerImages: answerImages,
          missingAnswerImages,
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
