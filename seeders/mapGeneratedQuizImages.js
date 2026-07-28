import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import Question from "../models/Question.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetDir = path.resolve(__dirname, "../assets/generated/quiz");
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const folder = [
  String(process.env.CLOUDINARY_FOLDER || "permisgo").replace(/^\/|\/$/g, ""),
  "quiz-questions",
].filter(Boolean).join("/");

const categories = [
  {
    key: "road-signs",
    file: "road-signs.png",
    limit: 8,
    matches: (text) => /sign|signal|speed limit|no entry|mandatory/i.test(text),
  },
  {
    key: "parking",
    file: "parking.png",
    limit: 8,
    matches: (text) => /park|parking|bus stop|loading zone|footpath/i.test(text),
  },
  {
    key: "junction-priority",
    file: "junction-priority.png",
    limit: 7,
    matches: (text) => /priority|right of way|junction|roundabout|merging|intersection|give way/i.test(text),
  },
  {
    key: "driver-safety",
    file: "driver-safety.png",
    limit: 7,
    matches: (text) => /driver|mirror|blind spot|seatbelt|following distance|overtak|lane|turning/i.test(text),
  },
];

const run = async () => {
  const urls = new Map();
  for (const category of categories) {
    const result = await cloudinary.uploader.upload(
      path.join(assetDir, category.file),
      {
        public_id: `${folder}/${category.key}`,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      },
    );
    urls.set(category.key, result.secure_url);
  }

  await mongoose.connect(mongoUri);
  try {
    const questionTexts = await Question.distinct("questionText", {
      status: "active",
      $or: [{ questionImage: "" }, { questionImage: { $exists: false } }],
    });
    const selected = new Set();
    const summary = {};

    for (const category of categories) {
      const texts = questionTexts
        .filter((text) => !selected.has(text) && category.matches(text))
        .slice(0, category.limit);
      texts.forEach((text) => selected.add(text));

      const result = await Question.updateMany(
        {
          questionText: { $in: texts },
          status: "active",
          $or: [{ questionImage: "" }, { questionImage: { $exists: false } }],
        },
        { $set: { questionImage: urls.get(category.key) } },
      );
      summary[category.key] = {
        distinctQuestions: texts.length,
        databaseRecords: result.modifiedCount,
        cloudinaryUrl: urls.get(category.key),
      };
    }

    const cloudinaryQuestions = await Question.countDocuments({
      questionImage: /^https:\/\/res\.cloudinary\.com\//,
      status: "active",
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          distinctQuestionsMapped: selected.size,
          activeQuestionRecordsWithCloudinaryImages: cloudinaryQuestions,
          categories: summary,
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
