import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { connectDB } from "../config/db.js";
import CmsPage from "../models/CmsPage.js";

const imageRoot = path.resolve("../permisgo-fontend/public/image");
const assets = {
  heroImage: ["image2.jpeg", "hero"],
  mentorImage: ["image1.jpeg", "mentor"],
  reason1Image: ["indicate1.png", "reason-1"],
  reason2Image: ["indicate2.png", "reason-2"],
  reason3Image: ["indicate3.png", "reason-3"],
  reason4Image: ["indicate4.png", "reason-4"],
};

await connectDB();
const urls = {};
for (const [key, [filename, publicId]] of Object.entries(assets)) {
  const result = await cloudinary.uploader.upload(path.join(imageRoot, filename), {
    folder: "permisgo/cms/who-are-we",
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });
  urls[key] = result.secure_url;
}

const updates = { ogImage: urls.heroImage };
for (const language of ["en", "bn", "fr"]) {
  for (const [key, url] of Object.entries(urls)) {
    updates[`translations.${language}.settings.${key}`] = url;
  }
}
await CmsPage.updateOne({ slug: "who-are-we" }, { $set: updates });
console.log("Who We Are images uploaded to Cloudinary and CMS URLs updated.");
console.log(urls);
await mongoose.disconnect();
