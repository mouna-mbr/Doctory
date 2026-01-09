const NotificationService = require("../services/NotificationService");

class NotificationController {
  // GET /notifications - Get user's notifications
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const { unreadOnly } = req.query;

      const filters = {};
      if (unreadOnly === "true") {
        filters.unreadOnly = true;
      }

      const notifications = await NotificationService.getUserNotifications(
        userId,
        filters
      );

      res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /notifications/unread-count - Get unread notification count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const count = await NotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PATCH /notifications/:id/read - Mark notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await NotificationService.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      const statusCode = error.message === "Notification not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PATCH /notifications/mark-all-read - Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;
      await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /notifications/:id - Delete notification
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await NotificationService.deleteNotification(id, userId);

      res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      const statusCode = error.message === "Notification not found" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /notifications - Delete all notifications
  async deleteAllNotifications(req, res) {
    try {
      const userId = req.user.userId;
      await NotificationService.deleteAllNotifications(userId);

      res.status(200).json({
        success: true,
        message: "All notifications deleted successfully",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new NotificationController();
