import "dotenv/config";
import { createHash } from "node:crypto";
import mongoose from "mongoose";

import cloudinary from "../config/cloudinary.js";
import RoadSign from "../models/RoadSign.js";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const signs = [
  ["Stop", "AB4", "priority", "You must come to a complete stop and give way before proceeding."],
  ["Give Way", "AB3a", "priority", "Slow down and give priority to traffic on the road you are entering."],
  ["No Entry", "B1", "prohibition", "Entry is prohibited for all vehicles from this direction."],
  ["No Parking", "B6a1", "prohibition", "Parking is prohibited on the side of the road where this sign is placed."],
  ["General Danger", "A14", "warning", "An unspecified hazard is ahead. Slow down and remain alert."],
  ["Children", "A13a", "warning", "Children may be crossing or present near the road. Reduce speed."],
  ["Pedestrian Crossing Ahead", "A13b", "warning", "A pedestrian crossing or pedestrian activity is ahead."],
  ["Dangerous Bend Right", "A1a", "warning", "A dangerous bend to the right is ahead. Adapt your speed and position."],
  ["Turn Right", "B21a1", "mandatory", "Vehicles must follow the direction indicated and turn right."],
  ["Pedestrian Crossing", "C20a", "information", "This sign indicates a designated pedestrian crossing."],
  ["Parking Area", "C1a", "information", "Parking is permitted in the designated area, subject to local restrictions."],
  ["Roundabout", "AB25", "priority", "A roundabout is ahead. Give way as required and choose the correct lane."],
];

const commonsFileUrl = (code) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    `France road sign ${code}.svg`,
  )}`;

const commonsMediaUrl = (code) => {
  const filename = `France_road_sign_${code}.svg`;
  const hash = createHash("md5").update(filename).digest("hex");
  return `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(filename)}`;
};

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const uploadWithRetry = async (sourceUrl, options) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await cloudinary.uploader.upload(sourceUrl, options);
    } catch (error) {
      lastError = error;
      if (!/429|Too Many Requests/i.test(error.message) || attempt === 3) {
        throw error;
      }
      await wait(attempt * 3000);
    }
  }
  throw lastError;
};

const downloadAsDataUri = async (url) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "PermisGo educational road-sign importer/1.0",
          Accept: "image/svg+xml,image/*",
        },
      });
      if (!response.ok) {
        throw new Error(`Wikimedia download failed (${response.status})`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:image/svg+xml;base64,${buffer.toString("base64")}`;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await wait(attempt * 3000);
    }
  }
  throw lastError;
};

const run = async () => {
  const folder = [
    String(process.env.CLOUDINARY_FOLDER || "permisgo").replace(/^\/|\/$/g, ""),
    "road-signs",
  ].filter(Boolean).join("/");

  await mongoose.connect(mongoUri);
  try {
    const imported = [];
    const failed = [];

    for (let index = 0; index < signs.length; index += 1) {
      const [title, code, category, description] = signs[index];
      const sourceUrl = commonsFileUrl(code);
      const mediaUrl = commonsMediaUrl(code);
      try {
        const existing = await RoadSign.findOne({ title }).lean();
        if (
          existing?.sourceUrl === sourceUrl &&
          /^https:\/\/res\.cloudinary\.com\//.test(existing.image || "")
        ) {
          imported.push(title);
          continue;
        }
        await wait(1500);
        const dataUri = await downloadAsDataUri(mediaUrl);
        const upload = await uploadWithRetry(dataUri, {
          public_id: `${folder}/${code.toLowerCase()}`,
          overwrite: true,
          invalidate: true,
          resource_type: "image",
        });
        await RoadSign.findOneAndUpdate(
          { title },
          {
            $set: {
              image: upload.secure_url,
              category,
              description,
              sourceUrl,
              license: "Wikimedia Commons file license",
              attribution: `French road sign diagram (${code}), Wikimedia Commons`,
              status: "active",
              sortOrder: index + 1,
            },
          },
          {
            upsert: true,
            returnDocument: "after",
            runValidators: true,
            setDefaultsOnInsert: true,
          },
        );
        imported.push(title);
      } catch (error) {
        failed.push({ title, code, error: error.message });
      }
    }

    const active = await RoadSign.countDocuments({ status: "active" });
    console.log(
      JSON.stringify(
        {
          success: failed.length === 0,
          imported: imported.length,
          activeRoadSigns: active,
          failed,
        },
        null,
        2,
      ),
    );
    if (failed.length) process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
