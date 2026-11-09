import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";

const router = Router();

// In-app Notifications Query & Counters
router.get("/unread-count", NotificationController.getUnreadCount);
router.get("/", NotificationController.getNotifications);

// Management & Dispatching
router.post("/", NotificationController.createNotification);
router.patch("/mark-all-read", NotificationController.markAllAsRead);
router.patch("/:id/read", NotificationController.markAsRead);
router.delete("/:id", NotificationController.deleteNotification);

export { router as notificationRoutes };
