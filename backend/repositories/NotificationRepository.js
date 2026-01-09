const Notification = require("../models/Notification");

class NotificationRepository {
  // Create new notification
  async create(notificationData) {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  // Find notifications by user ID
  async findByUserId(userId, filters = {}) {
    const query = { userId, ...filters };
    return await Notification.find(query)
      .populate("appointmentId")
      .sort({ createdAt: -1 });
  }

  // Find unread notifications
  async findUnreadByUserId(userId) {
    return await Notification.find({ userId, isRead: false })
      .populate("appointmentId")
      .sort({ createdAt: -1 });
  }

  // Get notification count
  async getUnreadCount(userId) {
    return await Notification.countDocuments({ userId, isRead: false });
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  // Delete notification
  async delete(notificationId) {
    return await Notification.findByIdAndDelete(notificationId);
  }

  // Delete all notifications for a user
  async deleteAllByUserId(userId) {
    return await Notification.deleteMany({ userId });
  }

  // Get recent notifications (last 30 days)
  async getRecentNotifications(userId, limit = 50) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await Notification.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate("appointmentId")
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = new NotificationRepository();
