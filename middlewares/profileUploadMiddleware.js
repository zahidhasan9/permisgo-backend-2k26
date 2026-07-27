// import fs from "fs";
// import path from "path";
// import crypto from "crypto";
// import multer from "multer";

// const __dirname = path.resolve();

// const profileUploadDir = path.join(__dirname, "uploads", "profiles");

// if (!fs.existsSync(profileUploadDir)) {
//   fs.mkdirSync(profileUploadDir, { recursive: true });
// }

// const imageMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// const profileStorage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, profileUploadDir);
//   },

//   filename(req, file, cb) {
//     const ext = path.extname(file.originalname || "").toLowerCase();
//     const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
//       ? ext
//       : ".jpg";

//     const uniqueName = `${Date.now()}-${crypto
//       .randomBytes(8)
//       .toString("hex")}${safeExt}`;

//     cb(null, uniqueName);
//   },
// });

// const imageFileFilter = (req, file, cb) => {
//   if (!imageMimeTypes.includes(file.mimetype)) {
//     return cb(new Error("Only JPG, PNG and WEBP image files are allowed."));
//   }

//   cb(null, true);
// };

// const profileUpload = multer({
//   storage: profileStorage,
//   fileFilter: imageFileFilter,
//   limits: {
//     fileSize: 3 * 1024 * 1024,
//   },
// });

// export const uploadProfileAvatar = (req, res, next) => {
//   profileUpload.single("avatar")(req, res, (error) => {
//     if (error) {
//       res.statusCode = 400;
//       return next(
//         new Error(error.message || "Failed to upload profile image."),
//       );
//     }

//     next();
//   });
// };

import { createUploadMiddleware } from "./createUploadMiddleware.js";

const allowedProfileMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const profileUpload = createUploadMiddleware({
  /*
  Local:
  uploads/profiles/
  */
  localSubfolder: "profiles",

  /*
  Cloudinary:
  permisgo/profiles/
  */
  cloudinarySubfolder: "profiles",

  allowedMimeTypes: allowedProfileMimeTypes,

  maxFileSize: 3 * 1024 * 1024,
});

export const uploadProfileAvatar = profileUpload.single("avatar");
