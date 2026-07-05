require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const ROLES = require("../constants/roles");

const seedAdmin = async () => {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || "admin@permisgo.com";
  const password = process.env.ADMIN_PASSWORD || "admin12345";

  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists");
    process.exit(0);
  }

  await User.create({
    name: "PermisGo Admin",
    email,
    password,
    role: ROLES.ADMIN,
    isEmailVerified: true,
  });

  console.log(`Admin created: ${email}`);
  process.exit(0);
};

seedAdmin();
