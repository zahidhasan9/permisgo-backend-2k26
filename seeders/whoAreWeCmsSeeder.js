import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import CmsPage from "../models/CmsPage.js";

const shared = {
  heroImage: "/image/image2.jpeg",
  heroButtonUrl: "/book-lesson",
  heroButtonColor: "#e5273d",
  heroButtonTextColor: "#ffffff",
  mentorImage: "/image/image1.jpeg",
  contactButtonUrl: "/book-lesson",
  contactButtonColor: "#ffffff",
  contactButtonTextColor: "#e2233d",
};

const translations = {
  en: {
    title: "Who We Are",
    excerpt: "Meet PermisGo and discover how we support learners throughout their driving journey.",
    seoTitle: "Who We Are | PermisGo",
    seoDescription: "Learn about PermisGo, our mission, expert instructors and driving programmes.",
    keywords: ["PermisGo", "driving school", "driving instructors"],
    imageAlt: "PermisGo driving lesson",
    settings: {
      ...shared,
      heroTitle: "Who are we?",
      heroSubtitle: "Permis Go is a driving school that connects candidates with state-certified driving instructors",
      heroDescription: "PermisGo connects learners with qualified instructors and supports every step of the journey toward a driving licence.",
      heroButton: "Book Your Lesson",
      sectionTitle: "Our Mission",
      sectionDescription: "Our goal is to offer quality training tailored to your pace and needs, helping you obtain your licence with confidence.",
      mentorTitle: "Expert Mentors",
      mentorDescription: "Our goal is to offer you quality training, tailored to your pace and needs. Whether you’re a beginner or looking to improve your skills, we do everything we can to help you obtain your licence with confidence.",
      programsTitle: "Our Programs",
      programsIntro: "We offer different packages to meet all needs:",
      programs: "Category B driving licence (standard and accelerated)\nSupervised driving (AAC)\nSupervised driving\nHighway Code in person and online\nAdvanced training courses",
      reasonsTitle: "Why choose PermisGo",
      reason1: "Qualified instructors",
      reason2: "500+ successful students",
      reason3: "Qualiopi certified",
      reason4: "Approved driving schools",
      contactTitle: "Ready to begin your driving adventure?",
      contactButton: "Book Your First Lesson",
    },
  },
  bn: {
    title: "আমরা কারা",
    excerpt: "PermisGo সম্পর্কে জানুন এবং আপনার ড্রাইভিং যাত্রার প্রতিটি ধাপে আমরা কীভাবে সহায়তা করি তা আবিষ্কার করুন।",
    seoTitle: "আমরা কারা | PermisGo",
    seoDescription: "PermisGo, আমাদের লক্ষ্য, অভিজ্ঞ প্রশিক্ষক এবং ড্রাইভিং প্রোগ্রাম সম্পর্কে জানুন।",
    keywords: ["PermisGo", "ড্রাইভিং স্কুল", "ড্রাইভিং প্রশিক্ষক"],
    imageAlt: "PermisGo ড্রাইভিং পাঠ",
    settings: {
      ...shared,
      heroTitle: "আমরা কারা?",
      heroSubtitle: "PermisGo একটি ড্রাইভিং স্কুল, যা শিক্ষার্থীদের রাষ্ট্র-স্বীকৃত ড্রাইভিং প্রশিক্ষকদের সঙ্গে যুক্ত করে।",
      heroDescription: "PermisGo যোগ্য প্রশিক্ষকদের সঙ্গে শিক্ষার্থীদের যুক্ত করে এবং ড্রাইভিং লাইসেন্স অর্জনের পুরো যাত্রায় সহায়তা করে।",
      heroButton: "আপনার পাঠ বুক করুন",
      sectionTitle: "আমাদের লক্ষ্য",
      sectionDescription: "আপনার গতি ও প্রয়োজন অনুযায়ী মানসম্মত প্রশিক্ষণ দিয়ে আত্মবিশ্বাসের সঙ্গে লাইসেন্স অর্জনে সাহায্য করাই আমাদের লক্ষ্য।",
      mentorTitle: "অভিজ্ঞ প্রশিক্ষক",
      mentorDescription: "আপনি নতুন শিক্ষার্থী হন বা দক্ষতা বাড়াতে চান—আমাদের প্রশিক্ষকেরা আপনার প্রয়োজন অনুযায়ী সহায়তা করেন।",
      programsTitle: "আমাদের প্রোগ্রাম",
      programsIntro: "সব ধরনের প্রয়োজন পূরণে আমাদের বিভিন্ন প্যাকেজ রয়েছে:",
      programs: "ক্যাটাগরি B ড্রাইভিং লাইসেন্স\nসঙ্গে থেকে শেখানো ড্রাইভিং (AAC)\nতত্ত্বাবধানে ড্রাইভিং\nঅনলাইন ও সরাসরি হাইওয়ে কোড\nউন্নত প্রশিক্ষণ কোর্স",
      reasonsTitle: "কেন PermisGo বেছে নেবেন",
      reason1: "যোগ্য প্রশিক্ষক",
      reason2: "৫০০+ সফল শিক্ষার্থী",
      reason3: "Qualiopi স্বীকৃত",
      reason4: "অনুমোদিত ড্রাইভিং স্কুল",
      contactTitle: "আপনার ড্রাইভিং যাত্রা শুরু করতে প্রস্তুত?",
      contactButton: "প্রথম পাঠ বুক করুন",
    },
  },
  fr: {
    title: "Qui sommes-nous",
    excerpt: "Découvrez PermisGo et notre accompagnement à chaque étape de votre apprentissage de la conduite.",
    seoTitle: "Qui sommes-nous | PermisGo",
    seoDescription: "Découvrez PermisGo, notre mission, nos moniteurs qualifiés et nos formations à la conduite.",
    keywords: ["PermisGo", "auto-école", "moniteurs de conduite"],
    imageAlt: "Leçon de conduite PermisGo",
    settings: {
      ...shared,
      heroTitle: "Qui sommes-nous ?",
      heroSubtitle: "PermisGo est une auto-école qui met en relation les candidats avec des moniteurs de conduite diplômés d’État.",
      heroDescription: "PermisGo accompagne les élèves avec des moniteurs qualifiés à chaque étape de leur parcours vers le permis de conduire.",
      heroButton: "Réserver votre leçon",
      sectionTitle: "Notre mission",
      sectionDescription: "Notre objectif est de proposer une formation de qualité, adaptée à votre rythme et à vos besoins, pour obtenir votre permis en toute confiance.",
      mentorTitle: "Moniteurs experts",
      mentorDescription: "Débutant ou en perfectionnement, vous bénéficiez d’un accompagnement adapté à votre rythme et à vos besoins.",
      programsTitle: "Nos formations",
      programsIntro: "Nous proposons différentes formules pour répondre à tous les besoins :",
      programs: "Permis B classique et accéléré\nConduite accompagnée (AAC)\nConduite supervisée\nCode de la route en salle et en ligne\nStages de perfectionnement",
      reasonsTitle: "Pourquoi choisir PermisGo",
      reason1: "Moniteurs diplômés",
      reason2: "Plus de 500 élèves reçus",
      reason3: "Certifié Qualiopi",
      reason4: "Écoles de conduite labellisées",
      contactTitle: "Prêt à commencer votre aventure de conduite ?",
      contactButton: "Réserver votre première leçon",
    },
  },
};

await connectDB();
await CmsPage.findOneAndUpdate(
  { slug: "who-are-we" },
  {
    $set: {
      translations,
      status: "published",
      ogImage: "/image/image2.jpeg",
      noIndex: false,
    },
    $setOnInsert: { slug: "who-are-we" },
  },
  { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
);
console.log("Who We Are CMS content seeded for EN, BN and FR.");
await mongoose.disconnect();
