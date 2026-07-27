import Referral from "../models/Referral";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";

export const getMyReferral = asyncHandler(async (req, res) => {
  const referral = await Referral.findOne({ user: req.user._id }).populate(
    "referredUsers.user",
    "name email role",
  );
  sendResponse(res, 200, "Referral details fetched.", referral);
});
