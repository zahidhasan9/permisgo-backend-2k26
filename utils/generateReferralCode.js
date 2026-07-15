import crypto from "crypto";
import User from "../models/User.js";

// Generate Unique Referral Code
export const generateReferralCode = async () => {
  let referralCode;
  let exists = true;

  while (exists) {
    referralCode = crypto
      .randomBytes(5) // 10 Characters
      .toString("hex")
      .toUpperCase();

    exists = await User.exists({ referralCode });
  }

  return referralCode;
};
