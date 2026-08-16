import "dotenv/config";
import { connectDB } from "../config/db.js";
import CmsPage from "../models/CmsPage.js";

const slugs = [
  "home", "about", "appointment", "b2b-partnership-request", "becoming-an-independent-instructor",
  "blogs", "book-lesson", "contact-us", "cookies", "cpf-offer", "disclaimer", "driving-instructor-salary",
  "driving-lessons", "driving-licence-glossary", "driving-license", "frequently-asked-questions",
  "general-terms-and-conditions", "helps", "highway-code-glossary", "inscription", "instructors", "legal-notice",
  "locations", "login-to-my-partner-area", "manage-my-cookies", "monitor-faqs", "monitor-privacy-policy", "offers",
  "person-with-a-disability", "pricing", "privacy-and-cookies", "privacy-policy", "refund-policy",
  "request-for-school-partnership", "reviews", "services", "student-privacy-policy", "terms-and-conditions",
  "traffic-laws", "user-login", "user-registration", "where-are-we", "who-are-we",
];

const titleFromSlug = (slug) => slug === "home" ? "PermisGo" : slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

await connectDB();
for (const slug of slugs) {
  const title = titleFromSlug(slug);
  await CmsPage.updateOne(
    { slug },
    { $setOnInsert: { slug, translations: { en: { title, seoTitle: `${title} | PermisGo`, seoDescription: `${title} from PermisGo driving school.` }, bn: {}, fr: {} }, status: "draft" } },
    { upsert: true },
  );
}
console.log(`${slugs.length} public CMS page slugs are registered as drafts.`);
process.exit(0);
