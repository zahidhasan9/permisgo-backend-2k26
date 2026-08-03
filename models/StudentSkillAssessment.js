import mongoose from "mongoose";

const schema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  skill: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: String, enum: ["C1", "C2", "C3", "C4"], default: "C1" },
  status: { type: String, enum: ["not_acquired", "to_work", "acquired"], required: true },
}, { timestamps: true });

schema.index({ student: 1, skill: 1 }, { unique: true });
export default mongoose.model("StudentSkillAssessment", schema);
