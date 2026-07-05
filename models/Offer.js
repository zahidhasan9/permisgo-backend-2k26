import mongoose from "mongoose";
import slugify from "slugify";

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    shortDescription: String,
    description: String,
    category: {
      type: String,
      enum: [
        "cpf",
        "driving_license",
        "accompanied",
        "a_la_carte",
        "code",
        "other",
      ],
      required: true,
    },
    image: String,
    regularPrice: Number,
    salePrice: Number,
    duration: String,
    totalHours: Number,
    features: [String],
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

offerSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
