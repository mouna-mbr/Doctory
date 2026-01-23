const AppointmentRepository = require("../repositories/AppointmentRepository");
const UserRepository = require("../repositories/UserRepository");
const AvailabilityService = require("./AvailabilityService");
const NotificationService = require("./NotificationService");
const Appointment = require("../models/Appointment");
class AppointmentService {
  // Patient creates appointment request
  async createAppointment(patientId, appointmentData) {
    const { doctorId, startDateTime, endDateTime, notes, reason } = appointmentData;

    // Validate doctor exists and is active
    const doctor = await UserRepository.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("Invalid doctor");
    }

    if (!doctor.isActive) {
      throw new Error("Doctor is not available");
    }

    // Validate patient
    const patient = await UserRepository.findById(patientId);
    if (!patient || patient.role !== "PATIENT") {
      throw new Error("Invalid patient");
    }

    // Validate dates
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const now = new Date();

    if (start <= now) {
      throw new Error("Appointment must be in the future");
    }

    if (end <= start) {
      throw new Error("End time must be after start time");
    }

    // Calculate duration (30 minutes for MVP)
    const durationMinutes = (end - start) / (1000 * 60);
    if (durationMinutes !== 30) {
      throw new Error("Appointment duration must be exactly 30 minutes");
    }

    // Check doctor availability
    const isAvailable = await AvailabilityService.checkAvailability(doctorId, start);
    if (!isAvailable) {
      throw new Error("Doctor is not available at this time");
    }

    // Check for conflicts
    const conflicts = await AppointmentRepository.findConflictingAppointments(
      doctorId,
      start,
      end
    );

    if (conflicts.length > 0) {
      throw new Error("Time slot not available");
    }

    // Create appointment
    const appointment = await AppointmentRepository.create({
      doctorId,
      patientId,
      startDateTime: start,
      endDateTime: end,
      status: "REQUESTED",
      notes,
      reason
    });

    // Create notification for doctor
    const formattedDate = start.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    await NotificationService.createAppointmentRequestNotification(
      doctorId,
      patient.fullName,
      appointment._id,
      formattedDate
    );

    return appointment;
  }
  async confirmAppointment(appointmentId, doctorId) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new Error("Rendez-vous introuvable");
    }

    if (appointment.doctorId._id.toString() !== doctorId.toString()) {
      throw new Error("Non autorisé");
    }

    if (appointment.status !== "REQUESTED") {
      throw new Error(`Impossible de confirmer un rendez-vous avec le statut: ${appointment.status}`);
    }

    if (new Date(appointment.startDateTime) <= new Date()) {
      throw new Error("Impossible de confirmer un rendez-vous passé");
    }

    const conflicts = await AppointmentRepository.findConflictingAppointments(
      doctorId,
      appointment.startDateTime,
      appointment.endDateTime,
      appointmentId
    );

    if (conflicts.length > 0) {
      throw new Error("Ce créneau n'est plus disponible");
    }

    // Récupérer le prix du docteur
    const doctor = await UserRepository.findById(doctorId);
    if (!doctor.consultationPrice || doctor.consultationPrice <= 0) {
      throw new Error("Le docteur doit définir un prix de consultation avant de confirmer des rendez-vous");
    }

    // Mettre le statut à CONFIRMED (patient devra payer)
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        status: "CONFIRMED",
        amount: doctor.consultationPrice,
        paymentStatus: "PENDING", // Paiement requis
      },
      { new: true, runValidators: true }
    ).populate('doctorId').populate('patientId');

    if (!updatedAppointment) {
      throw new Error("Erreur lors de la confirmation du rendez-vous");
    }

    // Formatage de la date pour la notification
    const formattedDate = new Date(updatedAppointment.startDateTime).toLocaleDateString(
      "fr-FR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    // Créer la notification de confirmation avec instructions de paiement
    await NotificationService.createAppointmentConfirmedNotification(
      updatedAppointment.patientId._id.toString(),
      updatedAppointment.doctorId.fullName,
      appointmentId,
      formattedDate,
      doctor.consultationPrice
    );

    return {
      success: true,
      message: "Rendez-vous confirmé avec succès. Le patient doit maintenant effectuer le paiement.",
      appointment: updatedAppointment,
      requiresPayment: true,
      amount: doctor.consultationPrice,
    };
  }



  // Cancel appointment (Doctor or Patient)
  async cancelAppointment(appointmentId, userId, userRole) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify user has permission to cancel
    const isDoctorOwner = appointment.doctorId._id.toString() === userId;
    const isPatientOwner = appointment.patientId._id.toString() === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isDoctorOwner && !isPatientOwner && !isAdmin) {
      throw new Error("Unauthorized");
    }

    // Can only cancel REQUESTED or CONFIRMED appointments
    if (!["REQUESTED", "CONFIRMED"].includes(appointment.status)) {
      throw new Error(`Cannot cancel appointment with status: ${appointment.status}`);
    }

    const updatedAppointment = await AppointmentRepository.updateStatus(
      appointmentId,
      "CANCELLED"
    );

    // Create notifications for both doctor and patient
    const formattedDate = new Date(appointment.startDateTime).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const doctorIdStr = appointment.doctorId._id.toString();
    const patientIdStr = appointment.patientId._id.toString();
    const cancellerName = userId === doctorIdStr ? appointment.doctorId.fullName : appointment.patientId.fullName;

    // Notify the other party
    if (userId === doctorIdStr) {
      await NotificationService.createAppointmentCancelledNotification(
        patientIdStr,
        cancellerName,
        appointmentId,
        formattedDate,
        userId
      );
    } else {
      await NotificationService.createAppointmentCancelledNotification(
        doctorIdStr,
        cancellerName,
        appointmentId,
        formattedDate,
        userId
      );
    }

    return {
      message: "Appointment cancelled successfully",
      appointment: updatedAppointment,
    };
  }

  // Get user's appointments
  async getUserAppointments(userId, userRole, filters = {}) {
    let appointments;

    if (userRole === "DOCTOR") {
      appointments = await AppointmentRepository.findByDoctorId(userId, filters);
    } else if (userRole === "PATIENT") {
      appointments = await AppointmentRepository.findByPatientId(userId, filters);
    } else if (userRole === "ADMIN") {
      appointments = await AppointmentRepository.findAll(filters);
    } else {
      throw new Error("Unauthorized");
    }

    return appointments;
  }

  // Get appointment by ID (with access control)
  async getAppointmentById(appointmentId, userId, userRole) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Check access rights
    const isDoctorOwner = appointment.doctorId._id.toString() === userId;
    const isPatientOwner = appointment.patientId._id.toString() === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isDoctorOwner && !isPatientOwner && !isAdmin) {
      throw new Error("Unauthorized");
    }

    return appointment;
  }

  // Get upcoming appointments
  async getUpcomingAppointments(userId, userRole) {
    return await AppointmentRepository.findUpcoming(userId, userRole);
  }

  // Mark appointment as completed (automatic or manual)
  async completeAppointment(appointmentId, userId, userRole) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Only doctor or admin can mark as completed
    const isDoctorOwner = appointment.doctorId._id.toString() === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isDoctorOwner && !isAdmin) {
      throw new Error("Unauthorized");
    }

    // Can only complete CONFIRMED appointments
    if (appointment.status !== "CONFIRMED") {
      throw new Error(`Cannot complete appointment with status: ${appointment.status}`);
    }

    const updatedAppointment = await AppointmentRepository.updateStatus(
      appointmentId,
      "COMPLETED"
    );

    // Create notification for patient
    const doctor = await UserRepository.findById(appointment.doctorId._id);
    const formattedDate = new Date(appointment.startDateTime).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    await NotificationService.createAppointmentCompletedNotification(
      appointment.patientId._id.toString(),
      doctor.fullName,
      appointmentId,
      formattedDate
    );

    return {
      message: "Appointment marked as completed",
      appointment: updatedAppointment,
    };
  }
}

module.exports = new AppointmentService();
