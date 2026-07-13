import fs from "fs";
import path from "path";

import cloudinary, { isCloudinaryStorage } from "../config/cloudinary.js";

const projectRoot = path.resolve();

const uploadsRoot = path.resolve(
  projectRoot,
  process.env.UPLOAD_DIR || "uploads",
);

/**
 * req.file এবং req.files থেকে সব file একটি array-তে আনে।
 */
const collectRequestFiles = (req) => {
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

  return files;
};

/**
 * Local ও Cloudinary দুই ধরনের upload থেকে final URL তৈরি করে।
 *
 * Local:
 * /uploads/profiles/image.jpg
 *
 * Cloudinary:
 * https://res.cloudinary.com/.../image.jpg
 */
export const getUploadedFileUrl = (file) => {
  if (!file) return "";

  const uploadedUrl = file.secure_url || file.url;

  if (uploadedUrl) {
    return uploadedUrl;
  }

  const rawPath = String(file.path || "").replace(/\\/g, "/");

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  const uploadsIndex = rawPath.lastIndexOf("uploads/");

  if (uploadsIndex >= 0) {
    return `/${rawPath.slice(uploadsIndex)}`;
  }

  if (file.filename) {
    return `/uploads/${file.filename}`;
  }

  return "";
};

/**
 * Multer memory buffer সরাসরি Cloudinary-তে upload করে।
 */
const uploadBuffer = (file, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    uploadStream.end(file.buffer);
  });

/**
 * Request-এর সব file Cloudinary-তে পাঠায়।
 *
 * req.file অথবা req.files-এর structure অপরিবর্তিত রাখে,
 * যাতে existing controller আগের মতো কাজ করে।
 */
export const uploadRequestFilesToCloudinary = async (req, folder) => {
  if (!isCloudinaryStorage) return;

  const files = collectRequestFiles(req);
  const uploadedAssets = [];

  try {
    for (const file of files) {
      const result = await uploadBuffer(file, folder);

      uploadedAssets.push(result);

      file.path = result.secure_url;
      file.url = result.secure_url;
      file.secure_url = result.secure_url;

      file.filename = result.public_id;
      file.public_id = result.public_id;

      file.storage = "cloudinary";
      file.resource_type = result.resource_type;
      file.format = result.format;
      file.size = result.bytes ?? file.size;

      delete file.buffer;
    }
  } catch (error) {
    /*
    Multiple file upload-এর মাঝখানে error হলে
    ইতোমধ্যে upload হওয়া asset cleanup করা হবে।
    */
    await Promise.allSettled(
      uploadedAssets.map((asset) =>
        cloudinary.uploader.destroy(asset.public_id, {
          resource_type: asset.resource_type || "image",
          invalidate: true,
        }),
      ),
    );

    throw error;
  }
};

/**
 * Cloudinary URL থেকে public ID বের করে।
 */
const extractCloudinaryPublicId = (fileUrl) => {
  try {
    const parsedUrl = new URL(fileUrl);

    if (!parsedUrl.hostname.includes("cloudinary.com")) {
      return null;
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const uploadIndex = pathParts.indexOf("upload");

    if (uploadIndex < 0) {
      return null;
    }

    let assetParts = pathParts.slice(uploadIndex + 1);

    // Cloudinary version number: v123456789
    if (/^v\d+$/.test(assetParts[0] || "")) {
      assetParts = assetParts.slice(1);
    }

    const assetPath = decodeURIComponent(assetParts.join("/"));

    // Extension বাদ দিয়ে Cloudinary public ID return করে
    return assetPath.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

/**
 * Local server থেকে file delete করে।
 */
const deleteLocalFile = async (fileUrl) => {
  const cleanUrl = String(fileUrl || "").split("?")[0];

  if (!cleanUrl.startsWith("/uploads/")) {
    return false;
  }

  const relativePath = cleanUrl.replace(/^\/uploads\//, "");
  const absolutePath = path.resolve(uploadsRoot, relativePath);

  /*
  Path traversal protection:
  uploads folder-এর বাইরের কোনো file delete করা যাবে না।
  */
  const isInsideUploads =
    absolutePath === uploadsRoot ||
    absolutePath.startsWith(`${uploadsRoot}${path.sep}`);

  if (!isInsideUploads) {
    return false;
  }

  try {
    await fs.promises.unlink(absolutePath);
    return true;
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Local uploaded file delete failed:", error.message);
    }

    return false;
  }
};

/**
 * Local অথবা Cloudinary থেকে পুরোনো file delete করে।
 */
export const deleteStoredFile = async (fileUrl) => {
  if (!fileUrl) return false;

  /*
  Cloudinary URL
  */
  if (/^https?:\/\//i.test(fileUrl)) {
    const publicId = extractCloudinaryPublicId(fileUrl);

    if (!publicId) {
      return false;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });

      return result.result === "ok" || result.result === "not found";
    } catch (error) {
      console.error("Cloudinary file delete failed:", error.message);
      return false;
    }
  }

  /*
  Local URL
  */
  return deleteLocalFile(fileUrl);
};
