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

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  express.json({
    limit: "2mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  }),
);

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

const __dirname = path.resolve();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Alucard Shop Backend API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", AuthRoutes);
// app.use("/api/address", AddressRoutes);
// app.use("/api/product", ProductRoutes);
// app.use("/api/category", CategoryRoutes);
// app.use("/api/brand", BrandRoutes);
// app.use("/api/review", ReviewRoutes);
// app.use("/api/cart", CartRoutes);
// app.use("/api/order", OrderRoutes);
// app.use("/api/banner", BannerRoutes);
// app.use("/api/coupon", CouponRoutes);
// app.use("/api/wishlist", WishlistRoutes);
// app.use("/api/question", QuestionRoutes);
// app.use("/api/dashboard", DashboardRoutes);
// app.use("/api/return-request", ReturnRequestRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server [STARTED] ~ http://localhost:${PORT}`);
});
