const AvailabilityService = require("../services/AvailabilityService");

class AvailabilityController {
  // POST /availability - Create availability slot (Doctor only)
  async createAvailability(req, res) {
    try {
      console.log("=== CREATE AVAILABILITY DEBUG ===");
      console.log("req.user:", req.user);
      console.log("req.body:", req.body);
      
      if (req.user.role !== "DOCTOR") {
        return res.status(403).json({
          success: false,
          message: "Only doctors can create availability slots",
        });
      }

      const doctorId = req.user.userId;
      const availabilityData = req.body;

      const availability = await AvailabilityService.createAvailability(
        doctorId,
        availabilityData
      );

      res.status(201).json({
        success: true,
        message: "Availability slot created successfully",
        data: availability,
      });
    } catch (error) {
      console.error("Create availability error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /availability/doctor/:doctorId - Get doctor's availability
  async getDoctorAvailability(req, res) {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      let availability;

      if (startDate && endDate) {
        availability = await AvailabilityService.getAvailabilityByDateRange(
          doctorId,
          startDate,
          endDate
        );
      } else {
        availability = await AvailabilityService.getDoctorAvailability(doctorId);
      }

      res.status(200).json({
        success: true,
        count: availability.length,
        data: availability,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /availability/doctor/:doctorId/slots - Get available time slots
  async getAvailableSlots(req, res) {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date is required",
        });
      }

      const slots = await AvailabilityService.getAvailableSlots(doctorId, date);

      res.status(200).json({
        success: true,
        count: slots.length,
        data: slots,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /availability/my - Get own availability (Doctor only)
  async getMyAvailability(req, res) {
    try {
      if (req.user.role !== "DOCTOR") {
        return res.status(403).json({
          success: false,
          message: "Only doctors can access this endpoint",
        });
      }

      const doctorId = req.user.userId;
      const { startDate, endDate } = req.query;

      let availability;

      if (startDate && endDate) {
        availability = await AvailabilityService.getAvailabilityByDateRange(
          doctorId,
          startDate,
          endDate
        );
      } else {
        availability = await AvailabilityService.getDoctorAvailability(doctorId);
      }

      res.status(200).json({
        success: true,
        count: availability.length,
        data: availability,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // PUT /availability/:id - Update availability slot (Doctor only)
  async updateAvailability(req, res) {
    try {
      if (req.user.role !== "DOCTOR") {
        return res.status(403).json({
          success: false,
          message: "Only doctors can update availability slots",
        });
      }

      const { id } = req.params;
      const doctorId = req.user.id;
      const updateData = req.body;

      const availability = await AvailabilityService.updateAvailability(
        id,
        doctorId,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Availability slot updated successfully",
        data: availability,
      });
    } catch (error) {
      const statusCode = error.message === "Unauthorized" ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // DELETE /availability/:id - Delete availability slot (Doctor only)
  async deleteAvailability(req, res) {
    try {
      if (req.user.role !== "DOCTOR") {
        return res.status(403).json({
          success: false,
          message: "Only doctors can delete availability slots",
        });
      }

      const { id } = req.params;
      const doctorId = req.user.userId;

      const result = await AvailabilityService.deleteAvailability(id, doctorId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const statusCode = error.message === "Unauthorized" ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AvailabilityController();
