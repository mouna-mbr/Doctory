const NotificationRepository = require("../repositories/NotificationRepository");
const { emitNotificationToUser, emitUnreadCountToUser } = require("../config/socket");

class NotificationService {
  // Create notification for appointment request (sent to doctor)
  async createAppointmentRequestNotification(doctorId, patientName, appointmentId, appointmentDate) {
    const notification = await NotificationRepository.create({
      userId: doctorId,
      type: "APPOINTMENT_REQUESTED",
      title: "Nouvelle demande de rendez-vous",
      message: `${patientName} a demandé un rendez-vous pour le ${appointmentDate}`,
      appointmentId,
    });

    // Emit real-time notification
    emitNotificationToUser(doctorId, notification);
    const count = await NotificationRepository.getUnreadCount(doctorId);
    emitUnreadCountToUser(doctorId, count);

    return notification;
  }

  // Create notification for appointment confirmation (sent to patient)
  async createAppointmentConfirmedNotification(patientId, doctorName, appointmentId, appointmentDate) {
    const notification = await NotificationRepository.create({
      userId: patientId,
      type: "APPOINTMENT_CONFIRMED",
      title: "Rendez-vous confirmé",
      message: `Votre rendez-vous avec Dr. ${doctorName} le ${appointmentDate} a été confirmé`,
      appointmentId,
    });

    // Emit real-time notification
    emitNotificationToUser(patientId, notification);
    const count = await NotificationRepository.getUnreadCount(patientId);
    emitUnreadCountToUser(patientId, count);

    return notification;
  }

  // Create notification for appointment cancellation (sent to both doctor and patient)
  async createAppointmentCancelledNotification(userId, userName, appointmentId, appointmentDate, cancelledBy) {
    const notification = await NotificationRepository.create({
      userId,
      type: "APPOINTMENT_CANCELLED",
      title: "Rendez-vous annulé",
      message: `Le rendez-vous du ${appointmentDate} ${cancelledBy === userId ? 'a été annulé' : `a été annulé par ${userName}`}`,
      appointmentId,
    });

    // Emit real-time notification
    emitNotificationToUser(userId, notification);
    const count = await NotificationRepository.getUnreadCount(userId);
    emitUnreadCountToUser(userId, count);

    return notification;
  }

  // Create notification for appointment completion (sent to patient)
  async createAppointmentCompletedNotification(patientId, doctorName, appointmentId, appointmentDate) {
    const notification = await NotificationRepository.create({
      userId: patientId,
      type: "APPOINTMENT_COMPLETED",
      title: "Rendez-vous terminé",
      message: `Votre rendez-vous avec Dr. ${doctorName} du ${appointmentDate} est terminé. Merci !`,
      appointmentId,
    });

    // Emit real-time notification
    emitNotificationToUser(patientId, notification);
    const count = await NotificationRepository.getUnreadCount(patientId);
    emitUnreadCountToUser(patientId, count);

    return notification;
  }

  // Create appointment reminder (sent 24 hours before)
  async createAppointmentReminderNotification(userId, doctorOrPatientName, appointmentId, appointmentDate, isDoctor) {
    const message = isDoctor 
      ? `Rappel: Rendez-vous avec ${doctorOrPatientName} demain à ${appointmentDate}`
      : `Rappel: Rendez-vous avec Dr. ${doctorOrPatientName} demain à ${appointmentDate}`;

    const notification = await NotificationRepository.create({
      userId,
      type: "APPOINTMENT_REMINDER",
      title: "Rappel de rendez-vous",
      message,
      appointmentId,
    });

    // Emit real-time notification
    emitNotificationToUser(userId, notification);
    const count = await NotificationRepository.getUnreadCount(userId);
    emitUnreadCountToUser(userId, count);

    return notification;
  }

  // Get user notifications
  async getUserNotifications(userId, filters = {}) {
    if (filters.unreadOnly) {
      return await NotificationRepository.findUnreadByUserId(userId);
    }
    return await NotificationRepository.findByUserId(userId, filters);
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    return await NotificationRepository.getUnreadCount(userId);
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    // Verify notification belongs to user
    const notifications = await NotificationRepository.findByUserId(userId);
    const notification = notifications.find(n => n._id.toString() === notificationId);
    
    if (!notification) {
      throw new Error("Notification not found");
    }

    return await NotificationRepository.markAsRead(notificationId);
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    return await NotificationRepository.markAllAsRead(userId);
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    // Verify notification belongs to user
    const notifications = await NotificationRepository.findByUserId(userId);
    const notification = notifications.find(n => n._id.toString() === notificationId);
    
    if (!notification) {
      throw new Error("Notification not found");
    }

    return await NotificationRepository.delete(notificationId);
  }

  // Delete all notifications for user
  async deleteAllNotifications(userId) {
    return await NotificationRepository.deleteAllByUserId(userId);
  }

  // Get recent notifications
  async getRecentNotifications(userId, limit = 50) {
    return await NotificationRepository.getRecentNotifications(userId, limit);
  }
}

module.exports = new NotificationService();
