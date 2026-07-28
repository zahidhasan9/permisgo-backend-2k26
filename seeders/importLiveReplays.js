import "dotenv/config";
import mongoose from "mongoose";

import LearningContent from "../models/LearningContent.js";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const replays = [
  {
    title: "Road Signs: Danger and Warning Signs",
    videoUrl: "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=35s",
    readMinutes: 5,
    topicCode: "L",
  },
  {
    title: "Priority Signs and Intersections",
    videoUrl: "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=5m19s",
    readMinutes: 2,
    topicCode: "P",
  },
  {
    title: "Temporary Road Signs",
    videoUrl: "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=6m57s",
    readMinutes: 1,
    topicCode: "L",
  },
  {
    title: "Prohibition Signs",
    videoUrl: "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=7m32s",
    readMinutes: 8,
    topicCode: "L",
  },
  {
    title: "Mandatory and Information Signs",
    videoUrl: "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=14m54s",
    readMinutes: 9,
    topicCode: "L",
  },
  {
    title: "Traffic Lights and Safe Decisions",
    videoUrl: "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=5m2s",
    readMinutes: 7,
    topicCode: "L",
  },
  {
    title: "Yield Rules and Speed Limits",
    videoUrl: "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=11m19s",
    readMinutes: 4,
    topicCode: "P",
  },
  {
    title: "First Aid for Drivers",
    videoUrl: "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=14m18s",
    readMinutes: 11,
    topicCode: "HAS",
  },
  {
    title: "Safety Distance and Motorway Driving",
    videoUrl: "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=24m56s",
    readMinutes: 9,
    topicCode: "R",
  },
  {
    title: "Eco Driving and Driver Responsibility",
    videoUrl: "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=37m20s",
    readMinutes: 9,
    topicCode: "E",
  },
];

const run = async () => {
  await mongoose.connect(mongoUri);
  try {
    const operations = replays.map((replay, index) => ({
      updateOne: {
        filter: { type: "live-replay", title: replay.title },
        update: {
          $set: {
            ...replay,
            type: "live-replay",
            subtitle: "Live code revision replay",
            category: "Code de la route",
            section: "Live Replays",
            description:
              "Watch this instructor-led replay to review the key rules and prepare for the theory exam.",
            difficulty: index < 5 ? "beginner" : "exam-focus",
            tags: ["live replay", "code de la route", "exam revision"],
            order: index + 1,
            status: "active",
            isFeatured: index < 2,
          },
        },
        upsert: true,
      },
    }));

    const result = await LearningContent.bulkWrite(operations);
    const active = await LearningContent.countDocuments({
      type: "live-replay",
      status: "active",
    });

    console.log(
      JSON.stringify(
        {
          success: true,
          matched: result.matchedCount,
          created: result.upsertedCount,
          updated: result.modifiedCount,
          activeLiveReplays: active,
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
