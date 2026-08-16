import "dotenv/config";
import { connectDB } from "../config/db.js";
import CmsPage from "../models/CmsPage.js";

const pages = [
  [
    "driving-license",
    "Driving Licence",
    "ড্রাইভিং লাইসেন্স",
    "Permis de conduire",
    "service",
  ],
  [
    "pricing",
    "Driving Lesson Pricing",
    "ড্রাইভিং লেসনের মূল্য",
    "Tarifs des leçons de conduite",
    "service",
  ],
  ["traffic-laws", "Traffic Laws", "ট্রাফিক আইন", "Code de la route", "guide"],
  ["contact-us", "Contact Us", "যোগাযোগ করুন", "Nous contacter", "support"],
  [
    "appointment",
    "Book an Appointment",
    "অ্যাপয়েন্টমেন্ট বুক করুন",
    "Prendre rendez-vous",
    "support",
  ],
  ["helps", "Help Centre", "সহায়তা কেন্দ্র", "Centre d’aide", "support"],
  ["who-are-we", "Who We Are", "আমরা কারা", "Qui sommes-nous", "company"],
  [
    "where-are-we",
    "Where We Are",
    "আমাদের অবস্থান",
    "Où nous trouver",
    "company",
  ],
  [
    "monitor-privacy-policy",
    "Instructor Privacy Policy",
    "প্রশিক্ষকের গোপনীয়তা নীতি",
    "Politique de confidentialité des moniteurs",
    "legal",
  ],
  [
    "student-privacy-policy",
    "Student Privacy Policy",
    "শিক্ষার্থীর গোপনীয়তা নীতি",
    "Politique de confidentialité des élèves",
    "legal",
  ],
  [
    "manage-my-cookies",
    "Manage My Cookies",
    "কুকি ব্যবস্থাপনা",
    "Gérer mes cookies",
    "legal",
  ],
  [
    "legal-notice",
    "Legal Notice",
    "আইনি বিজ্ঞপ্তি",
    "Mentions légales",
    "legal",
  ],
  [
    "privacy-policy",
    "Privacy Policy",
    "গোপনীয়তা নীতি",
    "Politique de confidentialité",
    "legal",
  ],
  [
    "general-terms-and-conditions",
    "General Terms and Conditions",
    "সাধারণ শর্তাবলি",
    "Conditions générales",
    "legal",
  ],
  [
    "request-for-school-partnership",
    "Driving School Partnership",
    "ড্রাইভিং স্কুল অংশীদারিত্ব",
    "Partenariat avec une auto-école",
    "business",
  ],
  [
    "b2b-partnership-request",
    "B2B Partnership",
    "বি-টু-বি অংশীদারিত্ব",
    "Partenariat B2B",
    "business",
  ],
  [
    "becoming-an-independent-instructor",
    "Become an Independent Instructor",
    "স্বাধীন প্রশিক্ষক হোন",
    "Devenir moniteur indépendant",
    "business",
  ],
  [
    "driving-instructor-salary",
    "Driving Instructor Salary",
    "ড্রাইভিং প্রশিক্ষকের বেতন",
    "Salaire d’un moniteur de conduite",
    "guide",
  ],
  [
    "monitor-faqs",
    "Instructor FAQs",
    "প্রশিক্ষকদের সাধারণ প্রশ্ন",
    "FAQ des moniteurs",
    "support",
  ],
  [
    "frequently-asked-questions",
    "Frequently Asked Questions",
    "সাধারণ জিজ্ঞাসা",
    "Questions fréquentes",
    "support",
  ],
  [
    "highway-code-glossary",
    "Highway Code Glossary",
    "হাইওয়ে কোড শব্দকোষ",
    "Glossaire du Code de la route",
    "guide",
  ],
  [
    "driving-licence-glossary",
    "Driving Licence Glossary",
    "ড্রাইভিং লাইসেন্স শব্দকোষ",
    "Glossaire du permis de conduire",
    "guide",
  ],
  [
    "person-with-a-disability",
    "Driving with a Disability",
    "প্রতিবন্ধিতা নিয়ে ড্রাইভিং",
    "Conduire avec un handicap",
    "guide",
  ],
  [
    "terms-and-conditions",
    "Terms and Conditions",
    "ব্যবহারের শর্তাবলি",
    "Conditions d’utilisation",
    "legal",
  ],
  [
    "privacy-and-cookies",
    "Privacy and Cookies",
    "গোপনীয়তা ও কুকি",
    "Confidentialité et cookies",
    "legal",
  ],
  [
    "refund-policy",
    "Refund Policy",
    "অর্থ ফেরত নীতি",
    "Politique de remboursement",
    "legal",
  ],
  [
    "disclaimer",
    "Disclaimer",
    "দায়মুক্তি ঘোষণা",
    "Clause de non-responsabilité",
    "legal",
  ],
];

const templates = {
  en: {
    service: (title) => [
      `Explore ${title} with PermisGo and find clear information to plan your driving journey.`,
      `PermisGo makes ${title.toLowerCase()} easier to understand, with transparent guidance and practical next steps. Review the information on this page and contact our team if you need personalised support.`,
    ],
    guide: (title) => [
      `Understand ${title} with clear, practical guidance from PermisGo.`,
      `This guide explains the essential points about ${title.toLowerCase()} in plain language. Use it to prepare confidently, make informed decisions and find the right next step in your driving journey.`,
    ],
    support: (title) => [
      `Get the information and support you need through ${title}.`,
      `PermisGo is here to answer your questions and help you move forward. Use the information on this page or contact our support team for assistance tailored to your situation.`,
    ],
    company: (title) => [
      `Discover ${title} and learn more about PermisGo.`,
      `Learn about our approach to driver training, the people behind PermisGo and our commitment to safe, accessible and confident learning.`,
    ],
    legal: (title) => [
      `Read the PermisGo ${title} and understand the rules that apply to our services.`,
      `This page explains ${title.toLowerCase()} in a clear and accessible way. Please review it carefully and contact PermisGo if you need clarification about your rights, choices or responsibilities.`,
    ],
    business: (title) => [
      `Explore ${title} opportunities with PermisGo.`,
      `Work with PermisGo to build accessible, high-quality driver training. This page explains the partnership pathway, key expectations and how to submit your request.`,
    ],
  },
  bn: {
    service: (title) => [
      `PermisGo-এর ${title} সম্পর্কে পরিষ্কার তথ্য জেনে আপনার ড্রাইভিং যাত্রার পরিকল্পনা করুন।`,
      `${title} সহজে বুঝতে PermisGo স্বচ্ছ নির্দেশনা ও ব্যবহারিক পরবর্তী ধাপ প্রদান করে। বিস্তারিত দেখুন এবং ব্যক্তিগত সহায়তার জন্য আমাদের দলের সঙ্গে যোগাযোগ করুন।`,
    ],
    guide: (title) => [
      `PermisGo-এর সহজ ও ব্যবহারিক নির্দেশনার মাধ্যমে ${title} বুঝুন।`,
      `এই গাইডে ${title}-এর গুরুত্বপূর্ণ বিষয়গুলো সহজ ভাষায় ব্যাখ্যা করা হয়েছে। আত্মবিশ্বাসের সঙ্গে প্রস্তুতি নিতে এবং সঠিক সিদ্ধান্ত নিতে তথ্যগুলো ব্যবহার করুন।`,
    ],
    support: (title) => [
      `${title}-এর মাধ্যমে প্রয়োজনীয় তথ্য ও সহায়তা পান।`,
      `PermisGo আপনার প্রশ্নের উত্তর দিতে এবং পরবর্তী ধাপে যেতে সহায়তা করে। আরও সহায়তার জন্য আমাদের সাপোর্ট দলের সঙ্গে যোগাযোগ করুন।`,
    ],
    company: (title) => [
      `${title} সম্পর্কে জানুন এবং PermisGo-কে আরও ভালোভাবে চিনুন।`,
      `আমাদের ড্রাইভার প্রশিক্ষণ পদ্ধতি, PermisGo দলের কাজ এবং নিরাপদ ও সহজলভ্য শিক্ষার প্রতি আমাদের অঙ্গীকার সম্পর্কে জানুন।`,
    ],
    legal: (title) => [
      `PermisGo-এর ${title} পড়ুন এবং আমাদের সেবায় প্রযোজ্য নিয়মগুলো বুঝুন।`,
      `এই পৃষ্ঠায় ${title} সহজ ভাষায় ব্যাখ্যা করা হয়েছে। আপনার অধিকার, পছন্দ বা দায়িত্ব সম্পর্কে প্রশ্ন থাকলে PermisGo-এর সঙ্গে যোগাযোগ করুন।`,
    ],
    business: (title) => [
      `PermisGo-এর সঙ্গে ${title}-এর সুযোগ সম্পর্কে জানুন।`,
      `উন্নত ও সহজলভ্য ড্রাইভার প্রশিক্ষণ গড়ে তুলতে PermisGo-এর সঙ্গে কাজ করুন। অংশীদারিত্বের ধাপ ও আবেদন পদ্ধতি এই পৃষ্ঠায় দেওয়া আছে।`,
    ],
  },
  fr: {
    service: (title) => [
      `Découvrez ${title} avec PermisGo et trouvez des informations claires pour organiser votre parcours de conduite.`,
      `PermisGo facilite la compréhension de ${title.toLowerCase()} grâce à des conseils transparents et des étapes pratiques. Consultez cette page ou contactez notre équipe pour un accompagnement personnalisé.`,
    ],
    guide: (title) => [
      `Comprenez ${title} grâce aux conseils clairs et pratiques de PermisGo.`,
      `Ce guide présente les points essentiels de ${title.toLowerCase()} dans un langage accessible. Utilisez ces informations pour vous préparer sereinement et choisir la prochaine étape adaptée.`,
    ],
    support: (title) => [
      `Obtenez les informations et l’aide nécessaires grâce à ${title}.`,
      `PermisGo répond à vos questions et vous aide à avancer. Consultez cette page ou contactez notre équipe pour un accompagnement adapté à votre situation.`,
    ],
    company: (title) => [
      `Découvrez ${title} et apprenez-en davantage sur PermisGo.`,
      `Découvrez notre approche de la formation à la conduite, l’équipe PermisGo et notre engagement pour un apprentissage sûr, accessible et efficace.`,
    ],
    legal: (title) => [
      `Consultez ${title} de PermisGo et comprenez les règles applicables à nos services.`,
      `Cette page explique ${title.toLowerCase()} de manière claire et accessible. Contactez PermisGo pour toute question concernant vos droits, vos choix ou vos responsabilités.`,
    ],
    business: (title) => [
      `Découvrez les opportunités de ${title} avec PermisGo.`,
      `Collaborez avec PermisGo pour développer une formation à la conduite accessible et de qualité. Cette page présente le parcours de partenariat et la procédure de demande.`,
    ],
  },
};

const makeTranslation = (language, title, kind, slug) => {
  const [description, content] = templates[language][kind](title);
  return {
    title,
    excerpt: description,
    content: `${description}\n\n${content}`,
    seoTitle: `${title} | PermisGo`.slice(0, 70),
    seoDescription: description.slice(0, 180),
    keywords: [...slug.split("-"), "PermisGo"],
    imageAlt: title,
  };
};

await connectDB();
let created = 0;
let filled = 0;
let preserved = 0;
for (const [slug, enTitle, bnTitle, frTitle, kind] of pages) {
  let generated = {
    en: makeTranslation("en", enTitle, kind, slug),
    bn: makeTranslation("bn", bnTitle, kind, slug),
    fr: makeTranslation("fr", frTitle, kind, slug),
  };
  if (slug === "appointment") {
    generated = {
      en: {
        title: "Book Your Driving Lesson",
        excerpt:
          "Schedule a driving lesson with a certified PermisGo instructor. Choose your preferred date, time and instructor.",
        content:
          "Use the appointment form to select your course, instructor, date, time and lesson duration. Enter your contact details and submit your request; the PermisGo team will then confirm availability.",
        seoTitle: "Book a Driving Lesson Appointment | PermisGo",
        seoDescription:
          "Book a PermisGo driving lesson with a certified instructor. Select your preferred date, time, instructor and lesson duration online.",
        keywords: [
          "driving lesson appointment",
          "book driving lesson",
          "PermisGo",
        ],
        imageAlt: "Book a driving lesson with PermisGo",
      },
      bn: {
        title: "আপনার ড্রাইভিং লেসন বুক করুন",
        excerpt:
          "PermisGo-এর সনদপ্রাপ্ত প্রশিক্ষকের সঙ্গে ড্রাইভিং লেসন নির্ধারণ করুন। পছন্দের তারিখ, সময় ও প্রশিক্ষক নির্বাচন করুন।",
        content:
          "অ্যাপয়েন্টমেন্ট ফর্ম থেকে কোর্স, প্রশিক্ষক, তারিখ, সময় ও লেসনের সময়কাল নির্বাচন করুন। যোগাযোগের তথ্য দিয়ে অনুরোধ পাঠালে PermisGo দল উপলভ্যতা নিশ্চিত করবে।",
        seoTitle: "ড্রাইভিং লেসনের অ্যাপয়েন্টমেন্ট বুক করুন | PermisGo",
        seoDescription:
          "PermisGo-এর সনদপ্রাপ্ত প্রশিক্ষকের সঙ্গে অনলাইনে ড্রাইভিং লেসন বুক করুন। তারিখ, সময়, প্রশিক্ষক ও লেসনের সময়কাল নির্বাচন করুন।",
        keywords: ["ড্রাইভিং লেসন", "অ্যাপয়েন্টমেন্ট", "PermisGo"],
        imageAlt: "PermisGo ড্রাইভিং লেসন বুকিং",
      },
      fr: {
        title: "Réservez votre leçon de conduite",
        excerpt:
          "Planifiez une leçon avec un moniteur PermisGo certifié. Choisissez la date, l’heure et le moniteur qui vous conviennent.",
        content:
          "Utilisez le formulaire pour choisir votre formation, votre moniteur, la date, l’heure et la durée de la leçon. Renseignez vos coordonnées puis envoyez votre demande; l’équipe PermisGo confirmera ensuite la disponibilité.",
        seoTitle: "Réserver une leçon de conduite | PermisGo",
        seoDescription:
          "Réservez une leçon de conduite PermisGo avec un moniteur certifié. Choisissez en ligne la date, l’heure, le moniteur et la durée.",
        keywords: ["leçon de conduite", "rendez-vous auto-école", "PermisGo"],
        imageAlt: "Réserver une leçon de conduite PermisGo",
      },
    };
  }
  const existing = await CmsPage.findOne({ slug });
  if (!existing) {
    await CmsPage.create({
      slug,
      translations: generated,
      status: "published",
      noIndex: false,
    });
    created += 1;
    continue;
  }
  for (const language of ["en", "bn", "fr"]) {
    const current = existing.translations?.[language];
    for (const [field, value] of Object.entries(generated[language])) {
      const currentValue = current?.[field];
      if (
        !currentValue ||
        (Array.isArray(currentValue) && !currentValue.length)
      )
        existing.set(`translations.${language}.${field}`, value);
    }
  }
  if (!existing.updatedBy) {
    if (slug === "appointment") existing.translations = generated;
    existing.status = "published";
    existing.noIndex = false;
    filled += 1;
  } else {
    preserved += 1;
  }
  await existing.save();
}
console.log(
  `Priority CMS migration complete: ${created} created, ${filled} completed and published, ${preserved} admin-edited records preserved.`,
);
process.exit(0);
