import "dotenv/config";
import mongoose from "mongoose";
import LearningContent from "../models/LearningContent.js";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGO_URI is not configured.");

const videos = [
  ["C1", "Vehicle Controls and Safety Checks", "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=35s", 6],
  ["C1", "Starting, Stopping and Steering Safely", "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=5m2s", 7],
  ["C1", "Using the Gearbox Correctly", "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=5m19s", 5],
  ["C2", "Road Signs and Visual Clues", "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=6m57s", 8],
  ["C2", "Positioning and Choosing a Traffic Lane", "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=11m19s", 6],
  ["C2", "Roundabouts and Priority Rules", "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=7m32s", 9],
  ["C3", "Safe Distances and Other Road Users", "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=24m56s", 8],
  ["C3", "Overtaking and Crossing Safely", "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=14m54s", 7],
  ["C3", "Driving in Heavy Traffic", "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=14m18s", 10],
  ["C4", "Independent and Economical Driving", "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=37m20s", 9],
  ["C4", "Vehicle Maintenance Essentials", "https://www.youtube.com/watch?v=xN-GGwtQk3o&t=35s", 6],
  ["C4", "Planning a Safe Journey", "https://www.youtube.com/watch?v=vsP_Zn-GM_E&t=5m2s", 7],
];

const run = async () => {
  await mongoose.connect(mongoUri);
  try {
    const result = await LearningContent.bulkWrite(videos.map(([category, title, videoUrl, readMinutes], index) => ({
      updateOne: {
        filter: { type: "e-learning-video", title },
        update: { $set: {
          type: "e-learning-video", category, title, videoUrl, readMinutes,
          section: `${category} E-learning`,
          subtitle: "Driving skills video lesson",
          description: "A practical video lesson to develop safe and confident driving skills.",
          difficulty: index < 3 ? "beginner" : index < 9 ? "medium" : "exam-focus",
          tags: ["driving lesson", "e-learning", category.toLowerCase()],
          order: index + 1, status: "active", isFeatured: index % 3 === 0,
        } },
        upsert: true,
      },
    })));
    const active = await LearningContent.countDocuments({ type: "e-learning-video", status: "active" });
    console.log(JSON.stringify({ success: true, created: result.upsertedCount, updated: result.modifiedCount, activeELearningVideos: active }, null, 2));
  } finally { await mongoose.disconnect(); }
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
