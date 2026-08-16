import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import TeacherProfile from "../models/TeacherProfile.js";
import TeacherVehicle from "../models/TeacherVehicle.js";
import TeacherLocation from "../models/TeacherLocation.js";
import TeacherAvailability from "../models/TeacherAvailability.js";

const PASSWORD = "11111111";

const teachers = [
  {
    name: "Lucas Martin",
    gender: "male",
    phone: "+33 6 12 34 56 01",
    experience: 9,
    qualification: "French State Certified Driving Instructor (BEPECASER)",
    rate: 48,
    rating: 4.9,
    reviews: 186,
    lessonTypes: ["manual", "automatic", "accelerated"],
    vehicleType: "manual",
    brand: "Renault",
    model: "Clio V",
    year: 2024,
    registration: "PG-T01-FR",
    address: "12 Avenue de la Grande Armée, 75017 Paris",
    city: "Paris",
    postalCode: "75017",
    lat: 48.8752,
    lng: 2.2874,
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    vehicleImage:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Sophie Bernard",
    gender: "female",
    phone: "+33 6 12 34 56 02",
    experience: 7,
    qualification: "Certified Road Safety and Driving Instructor",
    rate: 50,
    rating: 4.8,
    reviews: 142,
    lessonTypes: ["automatic", "accompanied", "code"],
    vehicleType: "automatic",
    brand: "Peugeot",
    model: "208",
    year: 2024,
    registration: "PG-T02-FR",
    address: "25 Rue de Lyon, 75012 Paris",
    city: "Paris",
    postalCode: "75012",
    lat: 48.8467,
    lng: 2.3732,
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    vehicleImage:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Thomas Dubois",
    gender: "male",
    phone: "+33 6 12 34 56 03",
    experience: 11,
    qualification: "Senior Driving Instructor and Road Safety Trainer",
    rate: 52,
    rating: 4.9,
    reviews: 231,
    lessonTypes: ["manual", "automatic", "accelerated"],
    vehicleType: "automatic",
    brand: "Toyota",
    model: "Yaris Hybrid",
    year: 2023,
    registration: "PG-T03-FR",
    address: "8 Place d’Italie, 75013 Paris",
    city: "Paris",
    postalCode: "75013",
    lat: 48.8318,
    lng: 2.3553,
    avatar:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
    vehicleImage:
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Emma Laurent",
    gender: "female",
    phone: "+33 6 12 34 56 04",
    experience: 6,
    qualification: "Licensed Driving Instructor and Eco-Driving Coach",
    rate: 47,
    rating: 4.7,
    reviews: 118,
    lessonTypes: ["manual", "accompanied", "code"],
    vehicleType: "manual",
    brand: "Citroën",
    model: "C3",
    year: 2023,
    registration: "PG-T04-FR",
    address: "41 Boulevard Voltaire, 75011 Paris",
    city: "Paris",
    postalCode: "75011",
    lat: 48.8584,
    lng: 2.3775,
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    vehicleImage:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Hugo Moreau",
    gender: "male",
    phone: "+33 6 12 34 56 05",
    experience: 8,
    qualification:
      "Certified Driving Instructor and Defensive Driving Specialist",
    rate: 49,
    rating: 4.8,
    reviews: 164,
    lessonTypes: ["automatic", "accelerated", "code"],
    vehicleType: "electric",
    brand: "Renault",
    model: "Megane E-Tech",
    year: 2024,
    registration: "PG-T05-FR",
    address: "16 Rue de Sèvres, 75007 Paris",
    city: "Paris",
    postalCode: "75007",
    lat: 48.8511,
    lng: 2.3264,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    vehicleImage:
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=80",
  },
];

const weeklySchedule = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  enabled: dayOfWeek >= 1 && dayOfWeek <= 6,
  slots:
    dayOfWeek >= 1 && dayOfWeek <= 6
      ? [{ startTime: "08:00", endTime: "18:00" }]
      : [],
}));

const run = async () => {
  await connectDB();
  const password = await bcrypt.hash(PASSWORD, 12);
  const admin = await User.findOne({ role: "admin" }).select("_id");

  for (const [index, item] of teachers.entries()) {
    const email = `teacher${index + 1}@gmail.com`;
    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: item.name,
          phone: item.phone,
          password,
          role: "teacher",
          avatar: item.avatar,
          designation: "Certified Driving Instructor",
          gender: item.gender,
          address: item.address,
          city: item.city,
          country: "France",
          language: "French, English",
          bio: `${item.name} is a patient and professional instructor focused on safe, confident and independent driving.`,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: "active",
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    const location = await TeacherLocation.findOneAndUpdate(
      { teacher: user._id, title: "Primary lesson meeting point" },
      {
        $set: {
          address: item.address,
          city: item.city,
          postalCode: item.postalCode,
          coordinates: { lat: item.lat, lng: item.lng },
          geoLocation: { type: "Point", coordinates: [item.lng, item.lat] },
          serviceRadiusKm: 20,
          meetingType: "both",
          status: "active",
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    const vehicle = await TeacherVehicle.findOneAndUpdate(
      { teacher: user._id, registrationNumber: item.registration },
      {
        $set: {
          vehicleName: `${item.brand} ${item.model}`,
          vehicleType: item.vehicleType,
          brand: item.brand,
          model: item.model,
          modelYear: item.year,
          vehicleImage: item.vehicleImage,
          isDefault: true,
          approvalStatus: "approved",
          status: "active",
          approvedBy: admin?._id || null,
          approvedAt: new Date(),
          adminNote: "Approved demo instructor vehicle.",
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    await TeacherAvailability.findOneAndUpdate(
      { teacher: user._id },
      {
        $set: {
          timezone: "Europe/Paris",
          weeklySchedule,
          dateExceptions: [],
          lessonDurationOptions: [60, 90, 120],
          bufferMinutes: 15,
          slotIntervalMinutes: 30,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    await TeacherProfile.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          bio: user.bio,
          experienceYears: item.experience,
          qualification: item.qualification,
          verificationStatus: "verified",
          lessonTypes: item.lessonTypes,
          hourlyRate: item.rate,
          rating: { average: item.rating, totalReviews: item.reviews },
          availabilityStatus: "available",
          vehicles: [vehicle._id],
          locations: [location._id],
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    console.log(`Ready: ${email} (${user._id})`);
  }

  console.log(`Password for all demo teachers: ${PASSWORD}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
