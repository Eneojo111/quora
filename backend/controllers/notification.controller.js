
import {
  getNotifications as getNotificationsService,
  getUnreadCount as getUnreadCountService,
  markNotificationRead as markNotificationReadService,
  markAllNotificationsRead as markAllNotificationsReadService
} from "../services/notification.service.js";

export const getNotifications = async (req, res) => {
  try {
    const result = await getNotificationsService({
      userId: req.user._id,
      page: req.query.page,
      limit: req.query.limit
    });

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve notifications"
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await getUnreadCountService(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error("Unread count error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve unread count"
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await markNotificationReadService({
      notificationId: req.params.id,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to mark notification as read"
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await markAllNotificationsReadService(
      req.user._id
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to mark notifications as read"
    });
  }
};
