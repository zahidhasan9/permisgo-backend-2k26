import "dotenv/config";
import path from "path";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { connectDB } from "../config/db.js";
import Testimonial from "../models/Testimonial.js";

const people = [
  ["Sophie Martin", "Passed first time", "The lessons were calm, clear and well structured. My instructor explained every mistake and the mock tests helped me pass on my first attempt.", "tes1.png"],
  ["Thomas Robert", "Refresher learner", "I had not driven for several years. The personalised sessions rebuilt my confidence and helped me feel safe again in busy traffic.", "tes2.png"],
  ["Emma Laurent", "PermisGo learner", "Booking was simple and my instructor was patient and punctual. Every lesson had a clear goal, so I always knew what to practise next.", "tes3.png"],
  ["Lucas Dubois", "Automatic learner", "The automatic driving course suited my schedule perfectly. The instructor gave practical feedback that improved my observation and planning.", "tes1.png"],
  ["Chloé Bernard", "Theory and driving learner", "The online code resources and practical lessons worked very well together. Reviewing my quiz mistakes made test preparation much easier.", "tes2.png"],
  ["Guillaume Moreau", "Newly qualified driver", "From registration to test day, the team was professional and supportive. I now drive independently with much more confidence.", "tes3.png"],
];

const run = async () => {
  await connectDB();
  for (let index = 0; index < people.length; index += 1) {
    const [name, role, message, filename] = people[index];
    const uploaded = await cloudinary.uploader.upload(path.resolve(`../permisgo-fontend/public/image/${filename}`), {
      folder: `${process.env.CLOUDINARY_FOLDER || "permisgo"}/testimonials`, public_id: `learner-${index + 1}`,
      overwrite: true, invalidate: true, transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }],
    });
    await Testimonial.findOneAndUpdate({ name }, { name, role, message, image: uploaded.secure_url, rating: 5, status: "active" }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
  }
  console.log(`Testimonials inserted/updated: ${people.length}`);
  await mongoose.connection.close();
};
run().catch(async (error) => { console.error(error); await mongoose.connection.close(); process.exit(1); });
