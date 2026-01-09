const AvailabilityRepository = require("../repositories/AvailabilityRepository");
const UserRepository = require("../repositories/UserRepository");

class AvailabilityService {
  // Doctor creates availability slot
  async createAvailability(doctorId, availabilityData) {
    const { date, startTime, endTime } = availabilityData;

    // Verify user is a doctor
    const doctor = await UserRepository.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("Only doctors can create availability slots");
    }

    // Validate date is in the future
    const availabilityDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (availabilityDate < today) {
      throw new Error("Cannot create availability for past dates");
    }

    // Check for overlapping availability slots
    const existingSlots = await AvailabilityRepository.findByDoctorAndDate(
      doctorId,
      availabilityDate
    );

    for (const slot of existingSlots) {
      if (this.timeSlotsOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        throw new Error("Availability slot overlaps with existing slot");
      }
    }

    const availability = await AvailabilityRepository.create({
      doctorId,
      date: availabilityDate,
      startTime,
      endTime,
      isAvailable: true,
    });

    return availability;
  }

  // Get doctor's availability slots
  async getDoctorAvailability(doctorId, filters = {}) {
    const doctor = await UserRepository.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("Invalid doctor");
    }

    return await AvailabilityRepository.findByDoctorId(doctorId, filters);
  }

  // Get availability by date range
  async getAvailabilityByDateRange(doctorId, startDate, endDate) {
    const doctor = await UserRepository.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("Invalid doctor");
    }

    return await AvailabilityRepository.findByDateRange(
      doctorId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  // Get available time slots for a specific date (for patients to view)
  async getAvailableSlots(doctorId, date) {
    const doctor = await UserRepository.findById(doctorId);
    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("Invalid doctor");
    }

    if (!doctor.isActive) {
      throw new Error("Doctor is not available");
    }

    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      return []; // No slots available for past dates
    }

    const slots = await AvailabilityRepository.getAvailableSlots(doctorId, targetDate);

    // Filter out slots in the past (for today)
    const now = new Date();
    return slots.filter(slot => new Date(slot.startDateTime) > now);
  }

  // Update availability slot
  async updateAvailability(availabilityId, doctorId, updateData) {
    const availability = await AvailabilityRepository.findById(availabilityId);

    if (!availability) {
      throw new Error("Availability slot not found");
    }

    // Verify ownership
    if (availability.doctorId._id.toString() !== doctorId) {
      throw new Error("Unauthorized");
    }

    // If updating time, check for overlaps
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime || availability.startTime;
      const endTime = updateData.endTime || availability.endTime;

      const existingSlots = await AvailabilityRepository.findByDoctorAndDate(
        doctorId,
        availability.date
      );

      for (const slot of existingSlots) {
        if (slot._id.toString() === availabilityId) continue; // Skip current slot
        
        if (this.timeSlotsOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
          throw new Error("Updated slot overlaps with existing slot");
        }
      }
    }

    return await AvailabilityRepository.update(availabilityId, updateData);
  }

  // Delete availability slot
  async deleteAvailability(availabilityId, doctorId) {
    const availability = await AvailabilityRepository.findById(availabilityId);

    if (!availability) {
      throw new Error("Availability slot not found");
    }

    // Verify ownership
    if (availability.doctorId._id.toString() !== doctorId) {
      throw new Error("Unauthorized");
    }

    await AvailabilityRepository.delete(availabilityId);

    return {
      message: "Availability slot deleted successfully",
    };
  }

  // Check if doctor is available at specific time
  async checkAvailability(doctorId, dateTime) {
    return await AvailabilityRepository.isAvailableAt(doctorId, dateTime);
  }

  // Helper function to check if time slots overlap
  timeSlotsOverlap(start1, end1, start2, end2) {
    const start1Minutes = this.timeToMinutes(start1);
    const end1Minutes = this.timeToMinutes(end1);
    const start2Minutes = this.timeToMinutes(start2);
    const end2Minutes = this.timeToMinutes(end2);

    return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
  }

  // Helper to convert time to minutes
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

module.exports = new AvailabilityService();
