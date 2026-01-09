const Appointment = require("../models/Appointment");

class AppointmentRepository {
  // Create new appointment
  async create(appointmentData) {
    const appointment = new Appointment(appointmentData);
    return await appointment.save();
  }

  // Find appointment by ID with populated references
  async findById(appointmentId) {
    return await Appointment.findById(appointmentId)
      .populate("doctorId", "fullName email phoneNumber")
      .populate("patientId", "fullName email phoneNumber");
  }

  // Find appointments by doctor ID
  async findByDoctorId(doctorId, filters = {}) {
    const query = { doctorId, ...filters };
    return await Appointment.find(query)
      .populate("patientId", "fullName email phoneNumber")
      .sort({ startDateTime: 1 });
  }

  // Find appointments by patient ID
  async findByPatientId(patientId, filters = {}) {
    const query = { patientId, ...filters };
    return await Appointment.find(query)
      .populate("doctorId", "fullName email phoneNumber")
      .sort({ startDateTime: 1 });
  }

  // Find all appointments (admin only)
  async findAll(filters = {}) {
    return await Appointment.find(filters)
      .populate("doctorId", "fullName email phoneNumber")
      .populate("patientId", "fullName email phoneNumber")
      .sort({ startDateTime: 1 });
  }

  // Update appointment status
  async updateStatus(appointmentId, status) {
    return await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true, runValidators: true }
    )
      .populate("doctorId", "fullName email phoneNumber")
      .populate("patientId", "fullName email phoneNumber");
  }

  // Check for conflicting appointments
  async findConflictingAppointments(doctorId, startDateTime, endDateTime, excludeId = null) {
    const query = {
      doctorId,
      status: { $in: ["REQUESTED", "CONFIRMED"] },
      $or: [
        {
          startDateTime: { $lt: endDateTime },
          endDateTime: { $gt: startDateTime },
        },
      ],
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    return await Appointment.find(query);
  }

  // Get upcoming appointments
  async findUpcoming(userId, role) {
    const now = new Date();
    const query = {
      startDateTime: { $gte: now },
      status: { $in: ["REQUESTED", "CONFIRMED"] },
    };

    if (role === "DOCTOR") {
      query.doctorId = userId;
    } else if (role === "PATIENT") {
      query.patientId = userId;
    }

    return await Appointment.find(query)
      .populate("doctorId", "fullName email phoneNumber")
      .populate("patientId", "fullName email phoneNumber")
      .sort({ startDateTime: 1 })
      .limit(10);
  }
}

module.exports = new AppointmentRepository();
