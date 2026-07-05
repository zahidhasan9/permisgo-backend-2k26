import jwt from "jsonwebtoken";
import User from "../models/User.js";
const protect = async (req, res, next) => {
  try {
    // const token = getTokenFromRequest(req);

    const getTokenFromRequest = (req) => {
      return req.cookies.token || null;
    };

    const token = getTokenFromRequest(req);

    if (!token) {
      res.statusCode = 401;
      throw new Error("Authentication failed: Token not provided.");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken.id).select("-password");

    if (!user) {
      res.statusCode = 401;
      throw new Error("Authentication failed: User not found.");
    }

    if (user.status === "inactive" || user.status === "blocked") {
      res.statusCode = 403;
      throw new Error("Your account has been deactivated.");
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    next(error);
  }
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.statusCode = 403;
      throw new Error("Forbidden. You do not have permission.");
    }
    next();
  };

export { protect, authorize };
