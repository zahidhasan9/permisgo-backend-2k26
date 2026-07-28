import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import EbookCourse from "../models/EbookCourse.js";
import EbookLesson from "../models/EbookLesson.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendImages = path.resolve(
  __dirname,
  "../../permisgo-rimel-auto-2k26/public/image",
);
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const images = [
  "legal-road-traffic.png",
  "help.jpg",
  "the-driver.png",
  "precautions-vehicle.png",
  "the-road.png",
  "mechanical-components.png",
  "other-road-users.png",
  "vehicle-safety.png",
  "road-signs.png",
  "traffic-hero.png",
];

const folder = [
  String(process.env.CLOUDINARY_FOLDER || "permisgo").replace(/^\/|\/$/g, ""),
  "code-ebooks",
].filter(Boolean).join("/");

const run = async () => {
  const uploaded = new Map();

  for (const filename of images) {
    const localPath = path.join(frontendImages, filename);
    const publicId = `${folder}/${path.parse(filename).name}`;
    const result = await cloudinary.uploader.upload(localPath, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    });
    uploaded.set(`/image/${filename}`, result.secure_url);
  }

  await mongoose.connect(mongoUri);
  try {
    for (const [oldPath, cloudUrl] of uploaded) {
      await EbookCourse.updateMany(
        { coverImage: oldPath },
        { $set: { coverImage: cloudUrl } },
      );
      await EbookLesson.updateMany(
        { coverImage: oldPath },
        { $set: { coverImage: cloudUrl } },
      );
      await EbookLesson.updateMany(
        { "contentBlocks.image": oldPath },
        { $set: { "contentBlocks.$[block].image": cloudUrl } },
        { arrayFilters: [{ "block.image": oldPath }] },
      );
    }

    const localCourseImages = await EbookCourse.countDocuments({
      coverImage: /^\/image\//,
    });
    const localLessonImages = await EbookLesson.countDocuments({
      $or: [
        { coverImage: /^\/image\// },
        { "contentBlocks.image": /^\/image\// },
      ],
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          uploaded: uploaded.size,
          localCourseImagesRemaining: localCourseImages,
          localLessonImagesRemaining: localLessonImages,
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
