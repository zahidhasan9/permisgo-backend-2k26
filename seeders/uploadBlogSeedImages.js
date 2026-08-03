import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { connectDB } from "../config/db.js";
import Blog from "../models/Blog.js";

const frontendImages = path.resolve("../permisgo-fontend/public/image");
const assets = [
  ["10-tips-to-pass-your-driving-test-on-the-first-try", "car-driver.jpg", "driving-test-tips"],
  ["step-by-step-guide-to-passing-your-driving-test", "driving-instructor.webp", "driving-test-guide"],
  ["common-traffic-mistakes-and-how-to-avoid-them", "traffic-hero.png", "traffic-mistakes"],
  ["complete-guide-to-becoming-a-confident-driver", "car.jpg", "confident-driver"],
  ["essential-road-signs-every-learner-should-know", "road-question.png", "road-signs-guide"],
];

const run = async () => {
  await connectDB();
  for (const [slug, filename, publicId] of assets) {
    const result = await cloudinary.uploader.upload(path.join(frontendImages, filename), {
      folder: `${process.env.CLOUDINARY_FOLDER || "permisgo"}/blogs`, public_id: publicId,
      overwrite: true, invalidate: true, resource_type: "image",
      transformation: [{ width: 1200, height: 470, crop: "fill", gravity: "auto", quality: "auto", fetch_format: "auto" }],
    });
    await Blog.updateOne({ slug }, { coverImage: result.secure_url });
  }
  console.log(`Driving blog images uploaded/updated: ${assets.length}`);
  await mongoose.connection.close();
};
run().catch(async (error) => { console.error(error); await mongoose.connection.close(); process.exit(1); });
