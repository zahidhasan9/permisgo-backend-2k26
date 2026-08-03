import multer from "multer";

import { uploadRequestFilesToCloudinary } from "../utils/uploadHelpers.js";

const allowedTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(new Error("Only JPG, PNG and WebP blog images are allowed."));
    }
    callback(null, true);
  },
}).single("coverImage");

const blogImageUpload = (req, res, next) => {
  parser(req, res, async (error) => {
    if (error) {
      error.statusCode = 400;
      return next(error);
    }

    try {
      if (req.file) {
        await uploadRequestFilesToCloudinary(req, "permisgo/blogs", true);
      }
      next();
    } catch (uploadError) {
      uploadError.statusCode = 502;
      next(uploadError);
    }
  });
};

export default blogImageUpload;
