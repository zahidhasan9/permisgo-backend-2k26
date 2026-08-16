import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import CmsPage from "../models/CmsPage.js";

const translation = (
  title,
  excerpt,
  content,
  badge,
  ctaLabel,
  seoTitle,
  seoDescription,
) => ({
  title,
  excerpt,
  content,
  seoTitle,
  seoDescription,
  keywords: ["PermisGo", "driving school", "driving lessons"],
  imageAlt: title,
  settings: { badge, ctaLabel },
});

const run = async () => {
  await connectDB();
  await CmsPage.findOneAndUpdate(
    { slug: "test" },
    {
      slug: "test",
      status: "published",
      noIndex: false,
      showInFooter: true,
      footerSection: "services",
      footerOrder: 10,
      pageTemplate: "modern",
      accentColor: "#174a9b",
      contentAlignment: "left",
      ctaUrl: "/appointment",
      ogImage: "/image/appoin-hero.png",
      translations: {
        en: translation(
          "Start Your Driving Journey with Confidence",
          "Flexible lessons, qualified instructors and personal support—everything you need to become a safe, confident driver.",
          "Learn at your own pace\n\nChoose lesson times that fit your schedule and train with an experienced instructor near you. Your learning plan adapts to your current level and goals.\n\nSupport at every step\n\nFrom your first assessment to practical-test preparation, PermisGo keeps every step clear, organised and easy to follow.\n\nReady when you are\n\nBook an appointment with our team and discover the training plan that works best for you.",
          "A smarter way to learn",
          "Book an appointment",
          "Flexible Driving Lessons | PermisGo",
          "Build confidence behind the wheel with flexible lessons, qualified instructors and personalised support from PermisGo.",
        ),
        bn: translation(
          "আত্মবিশ্বাসের সঙ্গে ড্রাইভিং শেখা শুরু করুন",
          "নমনীয় সময়সূচি, যোগ্য প্রশিক্ষক এবং ব্যক্তিগত সহায়তা—নিরাপদ ও আত্মবিশ্বাসী চালক হওয়ার জন্য প্রয়োজনীয় সবকিছু।",
          "নিজের গতিতে শিখুন\n\nআপনার সময়সূচির সঙ্গে মানানসই লেসন বেছে নিন এবং কাছাকাছি অভিজ্ঞ প্রশিক্ষকের সঙ্গে অনুশীলন করুন। আপনার বর্তমান দক্ষতা ও লক্ষ্য অনুযায়ী প্রশিক্ষণ পরিকল্পনা সাজানো হবে।\n\nপ্রতিটি ধাপে সহায়তা\n\nপ্রথম মূল্যায়ন থেকে ব্যবহারিক পরীক্ষার প্রস্তুতি পর্যন্ত PermisGo প্রতিটি ধাপ সহজ, পরিষ্কার ও গোছানো রাখে।\n\nআপনি প্রস্তুত হলেই শুরু করুন\n\nআমাদের দলের সঙ্গে অ্যাপয়েন্টমেন্ট বুক করুন এবং আপনার জন্য উপযুক্ত প্রশিক্ষণ পরিকল্পনা জেনে নিন।",
          "ড্রাইভিং শেখার স্মার্ট উপায়",
          "অ্যাপয়েন্টমেন্ট বুক করুন",
          "নমনীয় ড্রাইভিং লেসন | PermisGo",
          "PermisGo-এর নমনীয় লেসন, যোগ্য প্রশিক্ষক ও ব্যক্তিগত সহায়তায় আত্মবিশ্বাসী চালক হয়ে উঠুন।",
        ),
        fr: translation(
          "Commencez votre parcours de conduite en confiance",
          "Des leçons flexibles, des moniteurs qualifiés et un accompagnement personnalisé pour devenir un conducteur sûr et confiant.",
          "Apprenez à votre rythme\n\nChoisissez des horaires adaptés à votre emploi du temps et progressez avec un moniteur expérimenté près de chez vous. Votre formation s’adapte à votre niveau et à vos objectifs.\n\nUn accompagnement à chaque étape\n\nDe l’évaluation initiale à la préparation de l’examen pratique, PermisGo rend chaque étape claire, organisée et facile à suivre.\n\nCommencez quand vous êtes prêt\n\nPrenez rendez-vous avec notre équipe et découvrez la formule de formation qui vous convient le mieux.",
          "Une façon plus intelligente d’apprendre",
          "Prendre rendez-vous",
          "Leçons de conduite flexibles | PermisGo",
          "Gagnez en confiance au volant avec des leçons flexibles, des moniteurs qualifiés et l’accompagnement PermisGo.",
        ),
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
  console.log("Demo custom page updated: /test");
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
