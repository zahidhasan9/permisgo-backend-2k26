import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { connectDB } from "../config/db.js";
import CmsPage from "../models/CmsPage.js";

const imageRoot = path.resolve("../permisgo-fontend/public/image");
const assets = {
  heroImage: ["offer.png", "hero"],
  stat1Image: ["indicate1.png", "stat-1"],
  stat2Image: ["indicate2.png", "stat-2"],
  stat3Image: ["indicate3.png", "stat-3"],
  stat4Image: ["indicate4.png", "stat-4"],
};

await connectDB();
const urls = {};
for (const [key, [filename, publicName]] of Object.entries(assets)) {
  const result = await cloudinary.uploader.upload(path.join(imageRoot, filename), {
    folder: "permisgo/cms/driving-instructor-salary",
    public_id: publicName,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });
  urls[key] = result.secure_url;
}

const set = { ogImage: urls.heroImage };
for (const language of ["en", "bn", "fr"]) {
  for (const [key, url] of Object.entries(urls)) {
    set[`translations.${language}.settings.${key}`] = url;
  }
}
await CmsPage.updateOne({ slug: "driving-instructor-salary" }, { $set: set });
console.log("Salary CMS images uploaded to Cloudinary and URLs saved.");
console.log(urls);
await mongoose.disconnect();
