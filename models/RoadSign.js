import mongoose from "mongoose";

const roadSignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: String,
    category: String,
    description: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

const RoadSign = mongoose.model("RoadSign", roadSignSchema);
export default RoadSign;
