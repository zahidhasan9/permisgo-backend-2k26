import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import Question from "../models/Question.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(
  __dirname,
  "../../permisgo-rimel-auto-2k26/public/image",
);
const generatedDir = path.resolve(__dirname, "../assets/generated/quiz");
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const folder = [
  String(process.env.CLOUDINARY_FOLDER || "permisgo").replace(/^\/|\/$/g, ""),
  "quiz-questions",
].filter(Boolean).join("/");

const assets = {
  signs: [generatedDir, "road-signs.png"],
  parking: [generatedDir, "parking.png"],
  priority: [generatedDir, "junction-priority.png"],
  driver: [generatedDir, "driver-safety.png"],
  firstAid: [frontendDir, "help.jpg"],
  vehicle: [frontendDir, "vehicle-safety.png"],
  mechanical: [frontendDir, "mechanical-components.png"],
  roadUsers: [frontendDir, "other-road-users.png"],
  road: [frontendDir, "the-road.png"],
  regulations: [frontendDir, "road-signs.png"],
  ecology: [frontendDir, "traffic-hero.png"],
};

const categoryFor = (question) => {
  const text = String(question.questionText || "");
  const topic = question.topic || "";

  if (topic === "HAS" || /first aid|injur|accident|emergency stop/i.test(text)) {
    return "firstAid";
  }
  if (/park|parking|bus stop|loading zone|footpath/i.test(text)) return "parking";
  if (/priority|right of way|junction|roundabout|merging|intersection|give way/i.test(text)) {
    return "priority";
  }
  if (/sign|signal|speed limit|no entry|mandatory/i.test(text)) return "signs";
  if (topic === "M" || /brake|tyre|tire|steering|mechanical|engine/i.test(text)) {
    return "mechanical";
  }
  if (topic === "S" || /seatbelt|child safety|safety equipment|headlight/i.test(text)) {
    return "vehicle";
  }
  if (topic === "U" || /pedestrian|cyclist|motorcycle|animal|road user/i.test(text)) {
    return "roadUsers";
  }
  if (topic === "E" || /fuel|emission|eco|environment/i.test(text)) return "ecology";
  if (topic === "L") return "regulations";
  if (topic === "R" || /road|weather|fog|night|hydroplan/i.test(text)) return "road";
  return "driver";
};

const run = async () => {
  const urls = {};
  for (const [key, [directory, filename]] of Object.entries(assets)) {
    const result = await cloudinary.uploader.upload(
      path.join(directory, filename),
      {
        public_id: `${folder}/${key}`,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      },
    );
    urls[key] = result.secure_url;
  }

  await mongoose.connect(mongoUri);
  try {
    const questions = await Question.find({
      status: "active",
      questionImage: {
        $not: /^https:\/\/res\.cloudinary\.com\//,
      },
    })
      .select("_id questionText topic")
      .lean();

    if (questions.length) {
      await Question.bulkWrite(
        questions.map((question) => ({
          updateOne: {
            filter: { _id: question._id },
            update: {
              $set: { questionImage: urls[categoryFor(question)] },
            },
          },
        })),
      );
    }

    const [activeQuestions, withImages, missingImages] = await Promise.all([
      Question.countDocuments({ status: "active" }),
      Question.countDocuments({
        status: "active",
        questionImage: /^https:\/\/res\.cloudinary\.com\//,
      }),
      Question.countDocuments({
        status: "active",
        questionImage: {
          $not: /^https:\/\/res\.cloudinary\.com\//,
        },
      }),
    ]);

    console.log(
      JSON.stringify(
        {
          success: true,
          reusedAssets: Object.keys(assets).length,
          recordsUpdated: questions.length,
          activeQuestions,
          activeQuestionsWithCloudinaryImages: withImages,
          missingImages,
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
