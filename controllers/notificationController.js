import Notification from "../models/Notification";
import asyncHandler from "../utils/asyncHandler";
import sendResponse from "../utils/ApiResponse";

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  sendResponse(res, 200, "Notifications fetched.", notifications);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true, sentAt: new Date() },
    { new: true },
  );
  sendResponse(res, 200, "Notification marked as read.", notification);
});
