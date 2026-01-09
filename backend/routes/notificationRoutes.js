const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/NotificationController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// All notification routes require authentication
router.use(authMiddleware);

// Get user's notifications
router.get("/", (req, res) => NotificationController.getNotifications(req, res));

// Get unread notification count
router.get("/unread-count", (req, res) => NotificationController.getUnreadCount(req, res));

// Mark notification as read
router.patch("/:id/read", (req, res) => NotificationController.markAsRead(req, res));

// Mark all notifications as read
router.patch("/mark-all-read", (req, res) => NotificationController.markAllAsRead(req, res));

// Delete notification
router.delete("/:id", (req, res) => NotificationController.deleteNotification(req, res));

// Delete all notifications
router.delete("/", (req, res) => NotificationController.deleteAllNotifications(req, res));

module.exports = router;
