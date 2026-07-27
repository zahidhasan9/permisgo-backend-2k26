import { createUploadMiddleware } from "./createUploadMiddleware.js";

const allowedVehicleImageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const maxVehicleImageSizeMb = Number(
  process.env.VEHICLE_UPLOAD_MAX_FILE_SIZE_MB ||
    process.env.UPLOAD_MAX_FILE_SIZE_MB ||
    5,
);

if (
  !Number.isFinite(maxVehicleImageSizeMb) ||
  maxVehicleImageSizeMb <= 0
) {
  throw new Error(
    "VEHICLE_UPLOAD_MAX_FILE_SIZE_MB must be a positive number.",
  );
}

const vehicleUpload = createUploadMiddleware({
  // Local fallback: uploads/vehicles/
  localSubfolder: "vehicles",

  // Cloudinary: <CLOUDINARY_FOLDER>/vehicles/
  cloudinarySubfolder: "vehicles",

  allowedMimeTypes: allowedVehicleImageMimeTypes,
  maxFileSize: maxVehicleImageSizeMb * 1024 * 1024,
});

export default vehicleUpload;
