import multer from "multer";
import { uploadRequestFilesToCloudinary } from "../utils/uploadHelpers.js";

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (
      !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        file.mimetype,
      )
    )
      return callback(new Error("Only JPG, PNG and WebP images are allowed."));
    callback(null, true);
  },
}).single("image");

export default function testimonialImageUpload(req, res, next) {
  parser(req, res, async (error) => {
    if (error) {
      error.statusCode = 400;
      return next(error);
    }
    try {
      if (req.file)
        await uploadRequestFilesToCloudinary(
          req,
          "permisgo/testimonials",
          true,
        );
      next();
    } catch (uploadError) {
      uploadError.statusCode = 502;
      next(uploadError);
    }
  });
}
