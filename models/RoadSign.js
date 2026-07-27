import mongoose from "mongoose";

const roadSignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: String,
    category: String,
    description: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

roadSignSchema.index({ status: 1, sortOrder: 1, createdAt: -1 });

const RoadSign = mongoose.model("RoadSign", roadSignSchema);
export default RoadSign;
