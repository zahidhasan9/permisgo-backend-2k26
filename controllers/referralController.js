import crypto from "crypto";
import Referral from "../models/Referral.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";

const createUniqueReferralCode = async (user) => {
  let referralCode;
  let exists = true;

  while (exists) {
    const prefix =
      user.name?.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "PG";
    referralCode = `${prefix}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    exists = await Referral.exists({ referralCode });
  }

  return referralCode;
};

export const getMyReferral = asyncHandler(async (req, res) => {
  let referral = await Referral.findOne({ user: req.user._id }).populate(
    "referredUsers.user",
    "name email role",
  );

  if (!referral) {
    referral = await Referral.create({
      user: req.user._id,
      referralCode: await createUniqueReferralCode(req.user),
    });
  }

  sendResponse(res, 200, "Referral details fetched.", referral);
});
