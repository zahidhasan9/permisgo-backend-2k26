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

const translations = {
  "Sophie Martin": { bn: { role: "প্রথমবারেই উত্তীর্ণ", message: "ক্লাসগুলো শান্ত, পরিষ্কার ও সুন্দরভাবে সাজানো ছিল। প্রশিক্ষক প্রতিটি ভুল বুঝিয়ে দিয়েছেন এবং মক টেস্ট আমাকে প্রথমবারেই পাস করতে সাহায্য করেছে।" }, fr: { role: "Réussite du premier coup", message: "Les leçons étaient calmes, claires et bien structurées. Mon moniteur expliquait chaque erreur et les examens blancs m'ont aidée à réussir dès la première tentative." } },
  "Thomas Robert": { bn: { role: "রিফ্রেশার শিক্ষার্থী", message: "কয়েক বছর গাড়ি চালাইনি। ব্যক্তিগত সেশনগুলো আমার আত্মবিশ্বাস ফিরিয়ে দিয়েছে এবং ব্যস্ত রাস্তায় আবার নিরাপদ বোধ করতে সাহায্য করেছে।" }, fr: { role: "Élève en remise à niveau", message: "Je n'avais pas conduit depuis plusieurs années. Les séances personnalisées ont restauré ma confiance et m'ont permis de me sentir à nouveau en sécurité dans la circulation." } },
  "Emma Laurent": { bn: { role: "PermisGo শিক্ষার্থী", message: "বুকিং সহজ ছিল এবং আমার প্রশিক্ষক ধৈর্যশীল ও সময়নিষ্ঠ ছিলেন। প্রতিটি ক্লাসের পরিষ্কার লক্ষ্য থাকায় পরবর্তী অনুশীলন সবসময় বুঝতে পেরেছি।" }, fr: { role: "Élève PermisGo", message: "La réservation était simple et mon moniteur patient et ponctuel. Chaque leçon avait un objectif clair, je savais donc toujours quoi travailler ensuite." } },
  "Lucas Dubois": { bn: { role: "অটোমেটিক শিক্ষার্থী", message: "অটোমেটিক ড্রাইভিং কোর্সটি আমার সময়সূচির সঙ্গে দারুণ মানিয়েছে। প্রশিক্ষকের বাস্তব পরামর্শ আমার পর্যবেক্ষণ ও পরিকল্পনা উন্নত করেছে।" }, fr: { role: "Élève en boîte automatique", message: "La formation en boîte automatique convenait parfaitement à mon emploi du temps. Les conseils pratiques du moniteur ont amélioré mon observation et mon anticipation." } },
  "ChloÃ© Bernard": { bn: { role: "থিওরি ও ড্রাইভিং শিক্ষার্থী", message: "অনলাইন কোড রিসোর্স ও ব্যবহারিক ক্লাস একসঙ্গে খুব ভালো কাজ করেছে। কুইজের ভুলগুলো পর্যালোচনা করায় পরীক্ষার প্রস্তুতি অনেক সহজ হয়েছে।" }, fr: { role: "Élève code et conduite", message: "Les ressources de code en ligne et les leçons pratiques se complétaient très bien. Revoir mes erreurs aux quiz a beaucoup facilité ma préparation." } },
  "Guillaume Moreau": { bn: { role: "নতুন লাইসেন্সপ্রাপ্ত চালক", message: "রেজিস্ট্রেশন থেকে পরীক্ষার দিন পর্যন্ত দলটি পেশাদার ও সহায়ক ছিল। এখন আমি অনেক বেশি আত্মবিশ্বাস নিয়ে স্বাধীনভাবে গাড়ি চালাই।" }, fr: { role: "Nouveau conducteur", message: "De l'inscription au jour de l'examen, l'équipe a été professionnelle et encourageante. Je conduis maintenant seul avec beaucoup plus de confiance." } },
};

const run = async () => {
  await connectDB();
  for (let index = 0; index < people.length; index += 1) {
    const [name, role, message, filename] = people[index];
    const uploaded = await cloudinary.uploader.upload(path.resolve(`../permisgo-fontend/public/image/${filename}`), {
      folder: `${process.env.CLOUDINARY_FOLDER || "permisgo"}/testimonials`, public_id: `learner-${index + 1}`,
      overwrite: true, invalidate: true, transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }],
    });
    await Testimonial.findOneAndUpdate({ name }, { name, role, message, translations: translations[name] || {}, image: uploaded.secure_url, rating: 5, status: "active" }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
  }
  console.log(`Testimonials inserted/updated: ${people.length}`);
  await mongoose.connection.close();
};
run().catch(async (error) => { console.error(error); await mongoose.connection.close(); process.exit(1); });
