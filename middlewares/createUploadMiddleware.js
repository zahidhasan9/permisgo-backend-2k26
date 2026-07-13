import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";

import { isCloudinaryStorage } from "../config/cloudinary.js";

import { uploadRequestFilesToCloudinary } from "../utils/uploadHelpers.js";

const extensionByMimeType = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const cleanFolderPart = (value = "") =>
  String(value)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\\/g, "/");

/**
 * Cloudinary folder:
 * permisgo/uploads
 * permisgo/profiles
 */
const getCloudinaryFolder = (subfolder) => {
  const rootFolder = cleanFolderPart(
    process.env.CLOUDINARY_FOLDER || "permisgo",
  );

  const childFolder = cleanFolderPart(subfolder);

  return [rootFolder, childFolder].filter(Boolean).join("/");
};

const withStatus = (error, statusCode) => {
  error.statusCode = error.statusCode || statusCode;
  return error;
};

export const createUploadMiddleware = ({
  localSubfolder = "",
  cloudinarySubfolder = "uploads",
  allowedMimeTypes,
  maxFileSize = 5 * 1024 * 1024,
}) => {
  /*
  Local storage directory
  */
  const localDirectory = path.resolve(
    process.env.UPLOAD_DIR || "uploads",
    localSubfolder,
  );

  const diskStorage = multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdirSync(localDirectory, {
        recursive: true,
      });

      callback(null, localDirectory);
    },

    filename(req, file, callback) {
      const extension =
        extensionByMimeType[file.mimetype] ||
        path.extname(file.originalname || "").toLowerCase();

      const originalExtension = path.extname(file.originalname || "");

      const originalBaseName = path
        .basename(file.originalname || file.fieldname, originalExtension)
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);

      const uniqueName = [
        Date.now(),
        crypto.randomBytes(6).toString("hex"),
      ].join("-");

      const finalName = `${originalBaseName || file.fieldname}-${uniqueName}${extension}`;

      callback(null, finalName);
    },
  });

  const fileFilter = (req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error(`Unsupported file type: ${file.mimetype || "unknown"}.`),
      );
    }

    callback(null, true);
  };

  /*
  Cloudinary mode:
  File প্রথমে memory-তে আসবে, তারপর Cloudinary-তে যাবে।

  Local mode:
  File সরাসরি disk-এ যাবে।
  */
  const parser = multer({
    storage: isCloudinaryStorage ? multer.memoryStorage() : diskStorage,

    fileFilter,

    limits: {
      fileSize: maxFileSize,
    },
  });

  const cloudinaryFolder = getCloudinaryFolder(cloudinarySubfolder);

  const localPublicPrefix = ["/uploads", cleanFolderPart(localSubfolder)]
    .filter(Boolean)
    .join("/");

  /**
   * Local upload-এর জন্য public URL যোগ করে।
   */
  const addLocalPublicUrls = (req) => {
    const files = [];

    if (req.file) {
      files.push(req.file);
    }

    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else if (req.files && typeof req.files === "object") {
      Object.values(req.files).forEach((value) => {
        if (Array.isArray(value)) {
          files.push(...value);
        }
      });
    }

    files.forEach((file) => {
      file.storage = "local";
      file.url = `${localPublicPrefix}/${file.filename}`;
    });
  };

  /**
   * Multer middleware-এর পরে Cloudinary upload চালায়।
   */
  const wrap = (multerMiddleware) => (req, res, next) => {
    multerMiddleware(req, res, async (error) => {
      if (error) {
        return next(withStatus(error, 400));
      }

      try {
        if (isCloudinaryStorage) {
          await uploadRequestFilesToCloudinary(req, cloudinaryFolder);
        } else {
          addLocalPublicUrls(req);
        }

        next();
      } catch (uploadError) {
        next(withStatus(uploadError, 502));
      }
    });
  };

  /*
  Multer-এর existing API structure রাখা হয়েছে।
  তাই route-এর upload.single(), upload.any() ইত্যাদি
  পরিবর্তন করতে হবে না।
  */
  return {
    single: (fieldName) => wrap(parser.single(fieldName)),

    array: (fieldName, maxCount) => wrap(parser.array(fieldName, maxCount)),

    fields: (fields) => wrap(parser.fields(fields)),

    any: () => wrap(parser.any()),

    none: () => wrap(parser.none()),
  };
};
