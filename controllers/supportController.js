import SupportTicket from "../models/SupportTicket";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.create({
    ...req.body,
    user: req.user?._id,
  });
  sendResponse(res, 201, "Support ticket created.", ticket);
});

export const getTickets = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === "admin" || req.user.role === "support"
      ? {}
      : { user: req.user._id };
  const tickets = await SupportTicket.find(filter)
    .populate("user replies.sender", "name email role")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, "Support tickets fetched.", tickets);
});

export const replyTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, "Support ticket not found.");

  ticket.replies.push({ sender: req.user._id, message: req.body.message });
  if (req.body.status) ticket.status = req.body.status;
  await ticket.save();

  sendResponse(res, 200, "Support ticket replied.", ticket);
});
