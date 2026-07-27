import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    title: String,
    quantity: Number,
    price: Number,
    total: Number,
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    invoiceNumber: { type: String, unique: true, required: true },
    items: [invoiceItemSchema],
    subtotal: Number,
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: Number,
    invoicePdf: String,
    status: {
      type: String,
      enum: ["paid", "unpaid", "cancelled"],
      default: "unpaid",
    },
  },
  { timestamps: true },
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
