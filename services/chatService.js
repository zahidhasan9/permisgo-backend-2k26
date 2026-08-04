import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const allowedPair = (firstRole, secondRole) =>
  (firstRole === "student" && secondRole === "teacher") ||
  (firstRole === "teacher" && secondRole === "student");

export const getChatRecipient = async (currentUser, recipientId) => {
  if (!mongoose.isValidObjectId(recipientId))
    throw new Error("Invalid recipient.");
  const recipient = await User.findOne({
    _id: recipientId,
    status: "active",
  }).select("name email role avatar");
  if (!recipient || !allowedPair(currentUser.role, recipient.role))
    throw new Error("This chat recipient is not available.");
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

export const createChatMessage = async (sender, receiverId, body) => {
  const cleanBody = String(body || "").trim();
  if (!cleanBody) throw new Error("Message cannot be empty.");
  if (cleanBody.length > 4000) throw new Error("Message is too long.");
  const receiver = await getChatRecipient(sender, receiverId);
  const conversation = await findOrCreateConversation(sender._id, receiver._id);
  const message = await ChatMessage.create({
    conversation: conversation._id,
    sender: sender._id,
    receiver: receiver._id,
    body: cleanBody,
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
