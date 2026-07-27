import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    offer: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    hours: Number,
    includes: [String],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

const Package = mongoose.model("Package", packageSchema);
export default Package;
