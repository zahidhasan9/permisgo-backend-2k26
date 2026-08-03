import "dotenv/config";
import path from "node:path";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import LearningContent from "../models/LearningContent.js";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const sourceDirectory = "C:\\Users\\USER\\Downloads";
const folder = [
  String(process.env.CLOUDINARY_FOLDER || "permisgo").replace(/^\/|\/$/g, ""),
  "knowledge-sheets",
].filter(Boolean).join("/");

const sheets = [
  {
    source: "100 questions Avec photo.pdf",
    publicId: "100-driving-questions-with-photos",
    title: "100 Driving Questions with Photos",
    description: "Practice 100 visual driving-code questions with road and traffic photographs.",
    readMinutes: 45,
    order: 20,
    difficulty: "exam-focus",
    tags: ["driving-code", "practice-questions", "photos"],
  },
  {
    source: "basic driving.pdf",
    publicId: "basic-driving-guide",
    title: "Basic Driving Guide",
    description: "A beginner-friendly revision sheet covering essential driving knowledge.",
    readMinutes: 15,
    order: 21,
    difficulty: "beginner",
    tags: ["basic-driving", "beginner", "revision"],
  },
];

const run = async () => {
  const uploaded = [];
  for (const sheet of sheets) {
    const result = await cloudinary.uploader.upload(
      path.join(sourceDirectory, sheet.source),
      {
        public_id: `${folder}/${sheet.publicId}`,
        overwrite: true,
        invalidate: true,
        resource_type: "raw",
        format: "pdf",
      },
    );
    uploaded.push({ ...sheet, fileUrl: result.secure_url });
  }

  await mongoose.connect(mongoUri);
  try {
    const records = [];
    for (const sheet of uploaded) {
      const record = await LearningContent.findOneAndUpdate(
        { type: "knowledge-sheet", title: sheet.title },
        {
          $set: {
            type: "knowledge-sheet",
            title: sheet.title,
            description: sheet.description,
            fileUrl: sheet.fileUrl,
            readMinutes: sheet.readMinutes,
            order: sheet.order,
            difficulty: sheet.difficulty,
            tags: sheet.tags,
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
      records.push({
        id: record._id,
        title: record.title,
        fileUrl: record.fileUrl,
      });
    }

    console.log(JSON.stringify({
      success: true,
      uploadedPdfs: uploaded.length,
      knowledgeSheets: records,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
