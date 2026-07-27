import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: String,
    image: String,
    rating: { type: Number, default: 5, min: 1, max: 5 },
    message: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;
