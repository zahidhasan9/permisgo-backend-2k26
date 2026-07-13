import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import passport from "passport";
import rateLimit from "express-rate-limit";
import "dotenv/config";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

import AuthRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import learningContentRoutes from "./routes/learningContentRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
// import studentRoutes from"./routes/studentRoutes";
// import offerRoutes from"./routes/offerRoutes";
// import paymentRoutes from"./routes/paymentRoutes";
// import documentRoutes from"./routes/documentRoutes";
// import blogRoutes from"./routes/blogRoutes";
// import faqRoutes from"./routes/faqRoutes";
// import testimonialRoutes from"./routes/testimonialRoutes";
// import supportRoutes from"./routes/supportRoutes";
// import notificationRoutes from"./routes/notificationRoutes";
// import reviewRoutes from"./routes/reviewRoutes";
// import referralRoutes from"./routes/referralRoutes";

// import examRoutes from"./routes/examRoutes";

connectDB();

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.ADMIN_CLIENT_URL,
  process.env.ADMIN_URL,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    exposedHeaders: ["Set-Cookie", "Date", "ETag"],
  }),
);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(passport.initialize());
app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT || 500),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || "uploads");

app.use("/uploads", express.static(uploadDirectory));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PermisGo Backend API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", AuthRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/learning", learningContentRoutes);
app.use("/api/lessons", lessonRoutes);
//app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
//app.use("/api/offers", offerRoutes);
//app.use("/api/bookings", bookingRoutes);
//app.use("/api/payments", paymentRoutes);
//app.use("/api/documents", documentRoutes);
//app.use("/api/blogs", blogRoutes);
//app.use("/api/faqs", faqRoutes);
//app.use("/api/testimonials", testimonialRoutes);
//app.use("/api/support", supportRoutes);
//app.use("/api/notifications", notificationRoutes);
//app.use("/api/reviews", reviewRoutes);
//app.use("/api/referrals", referralRoutes);

//app.use("/api/exams", examRoutes);
//app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server [STARTED] ~ http://localhost:${PORT}`);
});
