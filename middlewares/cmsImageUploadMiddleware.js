import multer from "multer";
import { uploadRequestFilesToCloudinary } from "../utils/uploadHelpers.js";

const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    const allowed = allowedTypes.has(file.mimetype);
    callback(allowed ? null : new Error("Only JPG, PNG and WebP images are allowed."), allowed);
  },
}).single("image");

export default function cmsImageUpload(req, res, next) {
  parser(req, res, async (error) => {
    if (error) {
      error.statusCode = 400;
      return next(error);
    }
    try {
      if (!req.file) {
        const missing = new Error("An image is required.");
        missing.statusCode = 400;
        return next(missing);
      }
      await uploadRequestFilesToCloudinary(req, "permisgo/cms", true);
      next();
    } catch (uploadError) {
      uploadError.statusCode = 502;
      next(uploadError);
    }
  });
}
