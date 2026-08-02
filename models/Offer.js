import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["cpf", "to drive", "accompanied", "code", "other"],
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    hourOptions: [
      {
        label: String, // 01 hr
        value: Number, // 1
      },
    ],
    features: [
      {
        type: String,
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Offer", offerSchema);
