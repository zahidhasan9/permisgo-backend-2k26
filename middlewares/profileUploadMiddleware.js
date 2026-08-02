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
