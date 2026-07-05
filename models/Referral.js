import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    referralCode: { type: String, required: true, unique: true },
    referredUsers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: Date,
        rewardAmount: Number,
        status: {
          type: String,
          enum: ["pending", "approved", "paid"],
          default: "pending",
        },
      },
    ],
    totalAmountUsed: { type: Number, default: 0 },
    totalSponsorship: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Referral = mongoose.model("Referral", referralSchema);
export default Referral;
