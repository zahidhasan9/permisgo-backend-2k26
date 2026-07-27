import Payment from "../models/Payment";
import Invoice from "../models/Invoice";
import Booking from "../models/Booking";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

const createInvoiceNumber = () => `PG-${Date.now()}`;

export const createPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.create({ ...req.body, user: req.user._id });
  sendResponse(res, 201, "Payment initiated.", payment);
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, "Payment not found.");

  payment.status = "success";
  payment.paidAt = new Date();
  payment.transactionId = req.body.transactionId || payment.transactionId;
  await payment.save();

  if (payment.booking) {
    await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: "paid" });
  }

  const invoice = await Invoice.create({
    user: payment.user,
    payment: payment._id,
    booking: payment.booking,
    invoiceNumber: createInvoiceNumber(),
    items: [
      {
        title: "PermisGo Payment",
        quantity: 1,
        price: payment.amount,
        total: payment.amount,
      },
    ],
    subtotal: payment.amount,
    tax: 0,
    discount: 0,
    total: payment.amount,
    status: "paid",
  });

  sendResponse(res, 200, "Payment verified and invoice created.", {
    payment,
    invoice,
  });
});

export const getPayments = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const payments = await Payment.find(filter)
    .populate("booking offer user", "name email title bookingDate")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, "Payments fetched.", payments);
});

export const getInvoices = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const invoices = await Invoice.find(filter)
    .populate("payment booking user", "amount status bookingDate name email")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, "Invoices fetched.", invoices);
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate(
    "payment booking user",
  );
  if (!invoice) throw new ApiError(404, "Invoice not found.");
  sendResponse(res, 200, "Invoice fetched.", invoice);
});
