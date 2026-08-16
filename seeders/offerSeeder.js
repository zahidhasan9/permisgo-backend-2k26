import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Offer from "../models/Offer.js";

const commonCodeFeatures = [
  "Unlimited access to the code app",
  "Video courses and online manual",
  "Practice questions and mock exams",
  "Learning progress tracking",
];

const commonDrivingFeatures = [
  "Initial driving assessment",
  "Qualified driving instructor",
  "Dual-control training vehicle",
  "Online lesson planning",
  "Practical test preparation",
];

const offers = [
  {
    title: "Eco Code",
    category: "code",
    transmission: "both",
    description: "Essential online Highway Code preparation for every learner.",
    regularPrice: 19.99,
    salePrice: 0,
    features: commonCodeFeatures,
    isFeatured: false,
  },
  {
    title: "Zen Code",
    category: "code",
    transmission: "both",
    description:
      "Complete Highway Code revision with coaching and administration support.",
    regularPrice: 29.99,
    salePrice: 9.99,
    features: [...commonCodeFeatures, "Administrative support and coaching"],
    isFeatured: true,
  },
  {
    title: "Success Code",
    category: "code",
    transmission: "both",
    description: "Full theory preparation including a Highway Code exam place.",
    regularPrice: 49.99,
    salePrice: 33.99,
    features: [...commonCodeFeatures, "One Highway Code exam place"],
    isFeatured: false,
  },
  {
    title: "Manual Zen Permit",
    category: "to drive",
    transmission: "manual",
    description:
      "A flexible manual driving package with theory and practical preparation.",
    regularPrice: 699,
    salePrice: 599,
    hourOptions: [
      { label: "10 hr", value: 10 },
      { label: "20 hr", value: 20 },
      { label: "30 hr", value: 30 },
    ],
    features: commonDrivingFeatures,
    isFeatured: true,
  },
  {
    title: "Automatic Zen Permit",
    category: "to drive",
    transmission: "automatic",
    description:
      "A flexible automatic driving package with theory and practical preparation.",
    regularPrice: 699,
    salePrice: 599,
    hourOptions: [
      { label: "10 hr", value: 10 },
      { label: "20 hr", value: 20 },
      { label: "30 hr", value: 30 },
    ],
    features: commonDrivingFeatures,
    isFeatured: true,
  },
  {
    title: "Manual CPF License",
    category: "cpf",
    transmission: "manual",
    description: "CPF-eligible manual transmission driving licence training.",
    regularPrice: 1599,
    salePrice: 1570,
    hourOptions: [
      { label: "20 hr", value: 20 },
      { label: "25 hr", value: 25 },
      { label: "30 hr", value: 30 },
    ],
    features: [...commonDrivingFeatures, "CPF administration support"],
    isFeatured: false,
  },
  {
    title: "Automatic CPF License",
    category: "cpf",
    transmission: "automatic",
    description:
      "CPF-eligible automatic transmission driving licence training.",
    regularPrice: 1599,
    salePrice: 1570,
    hourOptions: [
      { label: "20 hr", value: 20 },
      { label: "25 hr", value: 25 },
      { label: "30 hr", value: 30 },
    ],
    features: [...commonDrivingFeatures, "CPF administration support"],
    isFeatured: false,
  },
  {
    title: "Manual Accompanied Driving",
    category: "accompanied",
    transmission: "manual",
    description:
      "Supervised manual driving preparation for confident young learners.",
    regularPrice: 899,
    salePrice: 799,
    hourOptions: [
      { label: "13 hr", value: 13 },
      { label: "20 hr", value: 20 },
    ],
    features: [...commonDrivingFeatures, "Accompanied driving guidance"],
    isFeatured: false,
  },
  {
    title: "Automatic Accompanied Driving",
    category: "accompanied",
    transmission: "automatic",
    description:
      "Supervised automatic driving preparation for confident young learners.",
    regularPrice: 899,
    salePrice: 799,
    hourOptions: [
      { label: "13 hr", value: 13 },
      { label: "20 hr", value: 20 },
    ],
    features: [...commonDrivingFeatures, "Accompanied driving guidance"],
    isFeatured: false,
  },
].map((offer) => ({ ...offer, status: "active" }));

const run = async () => {
  await connectDB();
  for (const offer of offers) {
    await Offer.findOneAndUpdate({ title: offer.title }, offer, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
      runValidators: true,
    });
  }
  console.log(`Offers inserted/updated: ${offers.length}`);
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
