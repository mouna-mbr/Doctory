const AppointmentRepository = require("../repositories/AppointmentRepository");
const UserRepository = require("../repositories/UserRepository");
const AvailabilityService = require("./AvailabilityService");

class AppointmentService {
  // Patient creates appointment request
  async createAppointment(patientId, appointmentData) {
    const { doctorId, startDateTime, endDateTime } = appointmentData;

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
    });

    return appointment;
  }

  // Doctor confirms appointment
  async confirmAppointment(appointmentId, doctorId) {
    const appointment = await AppointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify doctor owns this appointment
    if (appointment.doctorId._id.toString() !== doctorId) {
      throw new Error("Unauthorized");
    }

    // Can only confirm REQUESTED appointments
    if (appointment.status !== "REQUESTED") {
      throw new Error(`Cannot confirm appointment with status: ${appointment.status}`);
    }

    // Check if appointment is still in the future
    if (new Date(appointment.startDateTime) <= new Date()) {
      throw new Error("Cannot confirm past appointment");
    }

    // Check for conflicts again (in case another appointment was confirmed)
    const conflicts = await AppointmentRepository.findConflictingAppointments(
      doctorId,
      appointment.startDateTime,
      appointment.endDateTime,
      appointmentId
    );

    if (conflicts.length > 0) {
      throw new Error("Time slot no longer available");
    }

    const updatedAppointment = await AppointmentRepository.updateStatus(
      appointmentId,
      "CONFIRMED"
    );

    return {
      message: "Appointment confirmed successfully",
      appointment: updatedAppointment,
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

    return {
      message: "Appointment marked as completed",
      appointment: updatedAppointment,
    };
  }
}

module.exports = new AppointmentService();
