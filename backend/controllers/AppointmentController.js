const AppointmentService = require("../services/AppointmentService");

class AppointmentController {
  // POST /appointments - Create appointment (Patient only)
  async createAppointment(req, res) {
    try {
      // Ensure only patients can create appointments
      if (req.user.role !== "PATIENT") {
        return res.status(403).json({
          success: false,
          message: "Only patients can create appointments",
        });
      }

      const patientId = req.user.userId;
      const appointmentData = req.body;

      const appointment = await AppointmentService.createAppointment(
        patientId,
        appointmentData
      );

      res.status(201).json({
        success: true,
        message: "Appointment request created successfully",
        data: appointment,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /appointments/:id/confirm - Confirm appointment (Doctor only)
  async confirmAppointment(req, res) {
    try {
      // Ensure only doctors can confirm appointments
      if (req.user.role !== "DOCTOR") {
        return res.status(403).json({
          success: false,
          message: "Only doctors can confirm appointments",
        });
      }

      const { id } = req.params;
      const doctorId = req.user.userId;

      const result = await AppointmentService.confirmAppointment(id, doctorId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.appointment,
      });
    } catch (error) {
      const statusCode = error.message === "Unauthorized" ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /appointments/:id/cancel - Cancel appointment (Doctor, Patient, or Admin)
  async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const result = await AppointmentService.cancelAppointment(id, userId, userRole);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.appointment,
      });
    } catch (error) {
      const statusCode = error.message === "Unauthorized" ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /appointments/:id/complete - Mark appointment as completed (Doctor or Admin)
  async completeAppointment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const result = await AppointmentService.completeAppointment(id, userId, userRole);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.appointment,
      });
    } catch (error) {
      const statusCode = error.message === "Unauthorized" ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /appointments - Get user's appointments
  async getAppointments(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { status, startDate, endDate } = req.query;

      const filters = {};
      if (status) {
        filters.status = status;
      }
      if (startDate || endDate) {
        filters.startDateTime = {};
        if (startDate) {
          filters.startDateTime.$gte = new Date(startDate);
        }
        if (endDate) {
          filters.startDateTime.$lte = new Date(endDate);
        }
      }

      const appointments = await AppointmentService.getUserAppointments(
        userId,
        userRole,
        filters
      );

      res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /appointments/upcoming - Get upcoming appointments
  async getUpcomingAppointments(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      const appointments = await AppointmentService.getUpcomingAppointments(
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /appointments/:id - Get appointment by ID
  async getAppointmentById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const appointment = await AppointmentService.getAppointmentById(
        id,
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      const statusCode =
        error.message === "Unauthorized"
          ? 403
          : error.message === "Appointment not found"
          ? 404
          : 400;

      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AppointmentController();
