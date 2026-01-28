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

  // Dans NotificationService.js - ajoutez ces méthodes

// Create notification for payment success (sent to patient)
async createPaymentSuccessNotification(patientId, doctorName, amount, appointmentId) {
  const notification = await NotificationRepository.create({
    userId: patientId,
    type: "PAYMENT_SUCCESS",
    title: "Paiement confirmé",
    message: `Votre paiement de ${amount} DT pour la consultation avec Dr. ${doctorName} a été confirmé`,
    appointmentId,
  });

  // Emit real-time notification
  emitNotificationToUser(patientId, notification);
  const count = await NotificationRepository.getUnreadCount(patientId);
  emitUnreadCountToUser(patientId, count);

  return notification;
}

// Create notification for payment received (sent to doctor)
async createPaymentReceivedNotification(doctorId, patientName, amount, appointmentId) {
  const notification = await NotificationRepository.create({
    userId: doctorId,
    type: "PAYMENT_RECEIVED",
    title: "Paiement reçu",
    message: `Vous avez reçu ${amount} DT de ${patientName} pour la consultation`,
    appointmentId,
  });

  // Emit real-time notification
  emitNotificationToUser(doctorId, notification);
  const count = await NotificationRepository.getUnreadCount(doctorId);
  emitUnreadCountToUser(doctorId, count);

  return notification;
}

// Create notification for payment failure (sent to patient)
async createPaymentFailedNotification(patientId, doctorName, amount, appointmentId) {
  const notification = await NotificationRepository.create({
    userId: patientId,
    type: "PAYMENT_FAILED",
    title: "Échec du paiement",
    message: `Votre paiement de ${amount} DT pour la consultation avec Dr. ${doctorName} a échoué. Veuillez réessayer.`,
    appointmentId,
  });

  // Emit real-time notification
  emitNotificationToUser(patientId, notification);
  const count = await NotificationRepository.getUnreadCount(patientId);
  emitUnreadCountToUser(patientId, count);

  return notification;
}

// Create notification for payment refund (sent to patient)
async createPaymentRefundNotification(patientId, doctorName, amount, appointmentId) {
  const notification = await NotificationRepository.create({
    userId: patientId,
    type: "PAYMENT_REFUND",
    title: "Remboursement effectué",
    message: `Un remboursement de ${amount} DT pour votre consultation avec Dr. ${doctorName} a été effectué`,
    appointmentId,
  });

  // Emit real-time notification
  emitNotificationToUser(patientId, notification);
  const count = await NotificationRepository.getUnreadCount(patientId);
  emitUnreadCountToUser(patientId, count);

  return notification;
}


// Dans NotificationService.js - ajouter ces méthodes

// Notification pour nouvelle ordonnance
async createPrescriptionNotification(patientId, doctorId, prescriptionId) {
  const notification = await NotificationRepository.create({
    userId: patientId,
    type: "PRESCRIPTION_CREATED",
    title: "Nouvelle ordonnance disponible",
    message: "Votre médecin a créé une ordonnance pour vous. Téléchargez-la depuis votre espace patient.",
    prescriptionId,
  });

  emitNotificationToUser(patientId, notification);
  const count = await NotificationRepository.getUnreadCount(patientId);
  emitUnreadCountToUser(patientId, count);

  return notification;
}

// Notification pour demande d'examen
async createExamRequestNotification(patientId, doctorId, examId, examType) {
  const notification = await NotificationRepository.create({
    userId: patientId,
    type: "EXAM_REQUESTED",
    title: "Demande d'examen médical",
    message: `Votre médecin vous a prescrit un ${examType}. Consultez les détails dans votre espace patient.`,
    examId,
  });

  emitNotificationToUser(patientId, notification);
  const count = await NotificationRepository.getUnreadCount(patientId);
  emitUnreadCountToUser(patientId, count);

  return notification;
}

// Notification pour résultats d'examen téléchargés
async createExamResultsNotification(doctorId, patientId, examId) {
  const notification = await NotificationRepository.create({
    userId: doctorId,
    type: "EXAM_RESULTS_UPLOADED",
    title: "Résultats d'examen disponibles",
    message: "Votre patient a téléchargé les résultats d'examen. Veuillez les consulter.",
    examId,
  });

  emitNotificationToUser(doctorId, notification);
  const count = await NotificationRepository.getUnreadCount(doctorId);
  emitUnreadCountToUser(doctorId, count);

  return notification;
}

// Notification pour examen revu
async createExamReviewedNotification(patientId, doctorId, examId) {
  const notification = await NotificationRepository.create({
    userId: patientId,
    type: "EXAM_REVIEWED",
    title: "Résultats d'examen analysés",
    message: "Votre médecin a analysé vos résultats d'examen. Consultez ses commentaires.",
    examId,
  });

  emitNotificationToUser(patientId, notification);
  const count = await NotificationRepository.getUnreadCount(patientId);
  emitUnreadCountToUser(patientId, count);

  return notification;
}

// Ajouter ces types dans le modèle Notification
// "PRESCRIPTION_CREATED", "PRESCRIPTION_SIGNED", "EXAM_REQUESTED", 
// "EXAM_RESULTS_UPLOADED", "EXAM_REVIEWED"
}

module.exports = new NotificationService();
