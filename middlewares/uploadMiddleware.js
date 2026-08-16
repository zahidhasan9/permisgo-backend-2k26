import { createUploadMiddleware } from "./createUploadMiddleware.js";

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const maxFileSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 5);

const upload = createUploadMiddleware({
  /*
  Local:
  uploads/
  */
  localSubfolder: "",

  /*
  Cloudinary:
  permisgo/uploads/
  */
  cloudinarySubfolder: "uploads",

  allowedMimeTypes,

  maxFileSize: maxFileSizeMb * 1024 * 1024,
});

export default upload;
