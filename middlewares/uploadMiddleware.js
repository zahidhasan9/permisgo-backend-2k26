// import multer from "multer";
// import path from "path";

// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, process.env.UPLOAD_DIR || "src/uploads");
//   },
//   filename(req, file, cb) {
//     const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
//   if (allowed.includes(file.mimetype)) cb(null, true);
//   else cb(new Error("Only image and PDF files are allowed"));
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

// export default upload;

import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = process.env.UPLOAD_DIR || "uploads";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeExt = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${file.fieldname}-${unique}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error("Only image and PDF files are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
