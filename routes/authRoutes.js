// import express from "express";

// import {
//   register,
//   login,
//   me,
//   logout,
//   // sessionUser,
//   // getUsers,
//   // getUserById,
//   // updateUserProfile,
//   // changePassword,
//   // resetPasswordRequest,
//   // resetPassword,
//   // getCustomers,
//   // getCustomerById,
//   // updateCustomerByAdmin,
//   // deleteCustomerByAdmin,
// } from "../controllers/authController.js";

// import { protect } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// router.post("/register", register);
// router.post("/login", login);
// router.get("/me", protect, me);
// router.post("/logout", logout);

// // router.post("/resetPasswordRequest", resetPasswordRequest);
// // router.post("/reset-password/:id/:token", resetPassword);

// // // existing user routes
// // router.get("/users", protect, admin, getUsers);
// // router.get("/users/:id", protect, admin, getUserById);

// // // new customer admin routes
// // router.get("/customers", protect, admin, getCustomers);
// // router.get("/customers/:id", protect, admin, getCustomerById);
// // router.put("/customers/:id", protect, admin, updateCustomerByAdmin);
// // router.delete("/customers/:id", protect, admin, deleteCustomerByAdmin);

// // router.put("/user", protect, updateUserProfile);
// // router.put("/changepassword", protect, changePassword);

// export default router;

import express from "express";
import {
  register,
  login,
  me,
  logout,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadProfileAvatar } from "../middlewares/profileUploadMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.post("/logout", logout);

router.patch("/profile", protect, uploadProfileAvatar, updateProfile);
router.patch("/change-password", protect, changePassword);

export default router;
