import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: "Offer" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "EUR" },
    paymentMethod: {
      type: String,
      enum: ["card", "bank", "paypal", "wallet", "manual"],
      default: "card",
    },
    transactionId: String,
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    paidAt: Date,
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
