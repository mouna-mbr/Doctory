const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "APPOINTMENT_REQUESTED",
        "APPOINTMENT_CONFIRMED",
        "APPOINTMENT_CANCELLED",
        "APPOINTMENT_COMPLETED",
        "APPOINTMENT_REMINDER",
        "PAYMENT_SUCCESS",
        "PAYMENT_RECEIVED",
        "PAYMENT_FAILED", 
        "PAYMENT_REFUND",
        "PAYMENT_PENDING",
        "EXAM_REQUESTED",        // Prescription d'un examen
        "EXAM_SCHEDULED",        // Examen programmé
        "EXAM_RESULTS_READY",    // Résultats disponibles
        "EXAM_REVIEWED",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
