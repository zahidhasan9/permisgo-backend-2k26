import mongoose from "mongoose";

const contactSubmissionSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
    },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    subject: { type: String, required: true, trim: true, maxlength: 180 },
    location: { type: String, required: true, trim: true, maxlength: 240 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    status: {
      type: String,
      enum: ["new", "read", "resolved"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

contactSubmissionSchema.index({ createdAt: -1 });
contactSubmissionSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model("ContactSubmission", contactSubmissionSchema);
