import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import CmsPage from "../models/CmsPage.js";

const visuals = {
  heroImage: "/image/offer.png",
  heroBackground: "#eaf0f9",
  heroButtonUrl: "/becoming-an-independent-instructor",
  heroButtonColor: "#e4213c",
  heroButtonTextColor: "#ffffff",
  statisticsBackground: "#ffffff",
  statCardBackground: "#e8eef8",
  stat1Image: "/image/indicate1.png",
  stat2Image: "/image/indicate2.png",
  stat3Image: "/image/indicate3.png",
  stat4Image: "/image/indicate4.png",
  simulatorBackground: "#eaf0f9",
  simulatorCircleColor: "#ffffff",
  simulatorCarColor: "#1555b4",
  ctaButtonUrl: "/login-to-my-partner-area",
  ctaButtonColor: "#e4213c",
  ctaButtonTextColor: "#ffffff",
};

const translations = {
  en: {
    title: "Driving Instructor Salary",
    excerpt: "Estimate your potential income as an independent driving instructor.",
    seoTitle: "Driving Instructor Salary | PermisGo",
    seoDescription: "Estimate your income and discover the benefits of becoming a partner driving instructor with PermisGo.",
    imageAlt: "Professional driving instructor",
    settings: {
      ...visuals,
      heroTitle: "Calculate your salary as a driving instructor",
      heroDescription: "Estimate your potential income as a self-employed driving instructor and discover the benefits of partnering with PermisGo.",
      heroImageAlt: "Professional driving instructor",
      heroButton: "Join us as a driving instructor",
      stat1: "€3,500 net/month",
      stat2: "2K+ instructors partnered",
      stat3: "5M+ students",
      stat4: "91% instructor satisfaction",
      sectionTitle: "Estimate your income with PermisGo",
      sectionDescription: "Estimate your earnings as a partner instructor in one click with our simulator and discover your earning potential.",
      ctaButton: "Simulate my income",
    },
  },
  bn: {
    title: "ড্রাইভিং প্রশিক্ষকের আয়",
    excerpt: "স্বাধীন ড্রাইভিং প্রশিক্ষক হিসেবে আপনার সম্ভাব্য আয় হিসাব করুন।",
    seoTitle: "ড্রাইভিং প্রশিক্ষকের আয় | PermisGo",
    seoDescription: "PermisGo-এর অংশীদার প্রশিক্ষক হিসেবে সম্ভাব্য আয় ও সুবিধাগুলো জানুন।",
    imageAlt: "পেশাদার ড্রাইভিং প্রশিক্ষক",
    settings: {
      ...visuals,
      heroTitle: "ড্রাইভিং প্রশিক্ষক হিসেবে আপনার আয় হিসাব করুন",
      heroDescription: "স্বাধীন ড্রাইভিং প্রশিক্ষক হিসেবে সম্ভাব্য আয় হিসাব করুন এবং PermisGo-এর সঙ্গে কাজ করার সুবিধা জানুন।",
      heroImageAlt: "পেশাদার ড্রাইভিং প্রশিক্ষক",
      heroButton: "ড্রাইভিং প্রশিক্ষক হিসেবে যোগ দিন",
      stat1: "মাসে €৩,৫০০ নিট আয়",
      stat2: "২,০০০+ অংশীদার প্রশিক্ষক",
      stat3: "৫০ লক্ষ+ শিক্ষার্থী",
      stat4: "৯১% প্রশিক্ষক সন্তুষ্টি",
      sectionTitle: "PermisGo-এর সঙ্গে আপনার আয় হিসাব করুন",
      sectionDescription: "আমাদের সিমুলেটর ব্যবহার করে এক ক্লিকে অংশীদার প্রশিক্ষক হিসেবে আপনার সম্ভাব্য আয় জানুন।",
      ctaButton: "আমার আয় হিসাব করুন",
    },
  },
  fr: {
    title: "Salaire d’un moniteur de conduite",
    excerpt: "Estimez vos revenus potentiels en tant que moniteur de conduite indépendant.",
    seoTitle: "Salaire d’un moniteur de conduite | PermisGo",
    seoDescription: "Estimez vos revenus et découvrez les avantages de devenir moniteur partenaire PermisGo.",
    imageAlt: "Moniteur de conduite professionnel",
    settings: {
      ...visuals,
      heroTitle: "Calculez votre salaire de moniteur de conduite",
      heroDescription: "Estimez vos revenus potentiels en tant que moniteur indépendant et découvrez les avantages d’un partenariat avec PermisGo.",
      heroImageAlt: "Moniteur de conduite professionnel",
      heroButton: "Devenir moniteur partenaire",
      stat1: "3 500 € nets/mois",
      stat2: "Plus de 2 000 moniteurs partenaires",
      stat3: "Plus de 5 millions d’élèves",
      stat4: "91 % de satisfaction des moniteurs",
      sectionTitle: "Estimez vos revenus avec PermisGo",
      sectionDescription: "Estimez en un clic vos revenus de moniteur partenaire grâce à notre simulateur.",
      ctaButton: "Simuler mes revenus",
    },
  },
};

await connectDB();
await CmsPage.findOneAndUpdate(
  { slug: "driving-instructor-salary" },
  { $set: { translations, status: "published", ogImage: "/image/offer.png", noIndex: false } },
  { upsert: true, runValidators: true, setDefaultsOnInsert: true },
);
console.log("Driving instructor salary CMS content seeded for EN, BN and FR.");
await mongoose.disconnect();
