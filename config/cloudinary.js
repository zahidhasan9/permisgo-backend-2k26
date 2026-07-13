import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const storageValue = String(process.env.UPLOAD_STORAGE || "local")
  .trim()
  .toLowerCase();

export const isCloudinaryStorage = ["cloud", "cloudinary"].includes(
  storageValue,
);

const credentials = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

const hasCloudinaryCredentials = Object.values(credentials).every(Boolean);

if (isCloudinaryStorage && !hasCloudinaryCredentials) {
  throw new Error(
    "Cloudinary storage is enabled, but CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET is missing.",
  );
}
if (hasCloudinaryCredentials) {
  cloudinary.config({
    ...credentials,
    secure: true,
  });
}

export default cloudinary;
