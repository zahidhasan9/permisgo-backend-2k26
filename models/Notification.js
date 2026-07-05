import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["booking", "lesson", "payment", "attendance", "support", "system"],
      default: "system",
    },
    isRead: { type: Boolean, default: false },
    actionUrl: String,
    scheduledAt: Date,
    sentAt: Date,
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
