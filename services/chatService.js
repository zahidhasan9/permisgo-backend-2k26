import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

const allowedPair = (firstRole, secondRole) =>
  (firstRole === "student" && secondRole === "teacher") ||
  (firstRole === "teacher" && secondRole === "student");

const normalizeAttachment = (attachment) => {
  if (!attachment || typeof attachment !== "object") return null;

  const url = String(attachment.url || "").trim();
  if (!url) return null;

  return {
    url,
    name: String(attachment.name || attachment.filename || "Attachment").trim(),
    type: String(attachment.type || attachment.mimetype || "").trim(),
    size: Number(attachment.size || 0) || 0,
  };
};

export const getChatRecipient = async (currentUser, recipientId) => {
  if (!mongoose.isValidObjectId(recipientId))
    throw new Error("Invalid recipient.");
  const recipient = await User.findOne({
    _id: recipientId,
    status: "active",
  }).select("name email role avatar");
  if (!recipient || !allowedPair(currentUser.role, recipient.role))
    throw new Error("This chat recipient is not available.");

  const studentId =
    currentUser.role === "student" ? currentUser._id : recipient._id;
  const teacherId =
    currentUser.role === "teacher" ? currentUser._id : recipient._id;
  const hasBooking = await Booking.exists({
    student: studentId,
    teacher: teacherId,
    status: { $in: ["pending", "confirmed", "completed"] },
  });

  if (!hasBooking) {
    throw new Error(
      "You can only chat with an instructor or student connected through a booking.",
    );
  }
  return recipient;
};

export const findOrCreateConversation = async (firstId, secondId) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [firstId, secondId], $size: 2 },
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [firstId, secondId],
    });
  }
  return conversation;
};

export const createChatMessage = async (sender, receiverId, payload) => {
  const messagePayload =
    typeof payload === "string" ? { body: payload } : payload || {};
  const cleanBody = String(messagePayload.body || "").trim();
  const attachment = normalizeAttachment(messagePayload.attachment);

  if (!cleanBody && !attachment) throw new Error("Message cannot be empty.");
  if (cleanBody.length > 4000) throw new Error("Message is too long.");
  const receiver = await getChatRecipient(sender, receiverId);
  const conversation = await findOrCreateConversation(sender._id, receiver._id);
  const message = await ChatMessage.create({
    conversation: conversation._id,
    sender: sender._id,
    receiver: receiver._id,
    body: cleanBody,
    attachment: attachment || undefined,
  });
  conversation.lastMessage = message._id;
  await conversation.save();
  return {
    ...message.toObject(),
    sender: { _id: sender._id, name: sender.name, avatar: sender.avatar },
    receiver: {
      _id: receiver._id,
      name: receiver.name,
      avatar: receiver.avatar,
    },
  };
};
