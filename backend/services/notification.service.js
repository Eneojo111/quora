
import mongoose from "mongoose";
import Notification from "../models/notification.js";

// Create a notification, but never notify users about
// actions they perform on their own content.
export const createNotification = async ({
  recipientId,
  actorId,
  type,
  targetType,
  targetId,
  message
}) => {
  if (!recipientId || !actorId) {
    return null;
  }

  if (recipientId.toString() === actorId.toString()) {
    return null;
  }

  return Notification.create({
    recipient: recipientId,
    actor: actorId,
    type,
    targetType,
    targetId,
    message
  });
};

// Get the logged-in user's notifications.
export const getNotifications = async ({
  userId,
  page = 1,
  limit = 20
}) => {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 20)
  );

  const filter = { recipient: userId };

  const [notifications, total, unreadCount] =
    await Promise.all([
      Notification.find(filter)
        .populate("actor", "name username profilePicture")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        ...filter,
        isRead: false
      })
    ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      currentPage,
      pageLimit,
      total,
      totalPages: Math.ceil(total / pageLimit)
    }
  };
};

// Get unread notification count.
export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Mark one of the logged-in user's notifications as read.
export const markNotificationRead = async ({
  notificationId,
  userId
}) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    const error = new Error("Invalid notification ID");
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: userId
    },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  return notification;
};

// Mark all notifications belonging to the user as read.
export const markAllNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    {
      recipient: userId,
      isRead: false
    },
    {
      $set: { isRead: true }
    }
  );

  return {
    modifiedCount: result.modifiedCount
  };
};
