import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    value: mongoose.Schema.Types.Mixed,
    group: String,
  },
  { timestamps: true },
);

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;
