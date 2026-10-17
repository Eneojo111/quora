
import express from "express";

import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/notification.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All notification endpoints require login.
router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
