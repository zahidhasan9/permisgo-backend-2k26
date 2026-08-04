import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/ApiResponse.js";
import ChatMessage from "../models/ChatMessage.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import {
  findOrCreateConversation,
  getChatRecipient,
} from "../services/chatService.js";

export const getContacts = asyncHandler(async (req, res) => {
  const targetRole = req.user.role === "student" ? "teacher" : "student";
  const users = await User.find({
    role: targetRole,
    status: "active",
    _id: { $ne: req.user._id },
  })
    .select("name email role avatar")
    .sort({ name: 1 });
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate("lastMessage")
    .lean();
  const byUser = new Map();
  conversations.forEach((conversation) => {
    const contactId = conversation.participants.find(
      (id) => String(id) !== String(req.user._id),
    );
    if (contactId) byUser.set(String(contactId), conversation);
  });
  const unread = await ChatMessage.aggregate([
    { $match: { receiver: req.user._id, readAt: null } },
    { $group: { _id: "$sender", count: { $sum: 1 } } },
  ]);
  const unreadMap = new Map(
    unread.map((item) => [String(item._id), item.count]),
  );
  const contacts = users
    .map((user) => {
      const conversation = byUser.get(String(user._id));
      return {
        ...user.toObject(),
        lastMessage: conversation?.lastMessage || null,
        unreadCount: unreadMap.get(String(user._id)) || 0,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt || 0) -
        new Date(a.lastMessage?.createdAt || 0),
    );
  sendResponse(res, 200, "Chat contacts fetched.", contacts);
});

export const getMessages = asyncHandler(async (req, res) => {
  await getChatRecipient(req.user, req.params.userId);
  const conversation = await findOrCreateConversation(
    req.user._id,
    req.params.userId,
  );
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const messages = await ChatMessage.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  await ChatMessage.updateMany(
    { conversation: conversation._id, receiver: req.user._id, readAt: null },
    { readAt: new Date() },
  );
  sendResponse(res, 200, "Messages fetched.", messages.reverse());
});
