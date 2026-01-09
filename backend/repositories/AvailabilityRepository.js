const Availability = require("../models/Availability");

class AvailabilityRepository {
  // Create availability slot
  async create(availabilityData) {
    const availability = new Availability(availabilityData);
    return await availability.save();
  }

  // Find availability by ID
  async findById(availabilityId) {
    return await Availability.findById(availabilityId).populate(
      "doctorId",
      "fullName email"
    );
  }

  // Find availability by doctor and date
  async findByDoctorAndDate(doctorId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await Availability.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ startTime: 1 });
  }

  // Find all availability for a doctor
  async findByDoctorId(doctorId, filters = {}) {
    const query = { doctorId, ...filters };
    return await Availability.find(query).sort({ date: 1, startTime: 1 });
  }

  // Find availability by date range
  async findByDateRange(doctorId, startDate, endDate) {
    return await Availability.find({
      doctorId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1, startTime: 1 });
  }

  // Update availability
  async update(availabilityId, updateData) {
    return await Availability.findByIdAndUpdate(
      availabilityId,
      updateData,
      { new: true, runValidators: true }
    ).populate("doctorId", "fullName email");
  }

  // Delete availability
  async delete(availabilityId) {
    return await Availability.findByIdAndDelete(availabilityId);
  }

  // Check if doctor is available at specific time
  async isAvailableAt(doctorId, dateTime) {
    const date = new Date(dateTime);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const timeString = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const availabilities = await Availability.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      isAvailable: true,
    });

    // Check if the time falls within any availability slot
    for (const slot of availabilities) {
      if (this.isTimeBetween(timeString, slot.startTime, slot.endTime)) {
        return true;
      }
    }

    return false;
  }

  // Helper function to check if time is between start and end
  isTimeBetween(time, startTime, endTime) {
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  }

  // Helper function to convert time string to minutes
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Get available time slots for booking (30-minute slots)
  async getAvailableSlots(doctorId, date) {
    const availabilities = await this.findByDoctorAndDate(doctorId, date);
    
    if (availabilities.length === 0) {
      return [];
    }

    const slots = [];
    
    for (const availability of availabilities) {
      if (!availability.isAvailable) continue;

      const startMinutes = this.timeToMinutes(availability.startTime);
      const endMinutes = this.timeToMinutes(availability.endTime);
      
      // Generate 30-minute slots
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const slotStartTime = this.minutesToTime(minutes);
        const slotEndTime = this.minutesToTime(minutes + 30);
        
        // Don't include slot if it extends beyond availability end time
        if (minutes + 30 <= endMinutes) {
          slots.push({
            startTime: slotStartTime,
            endTime: slotEndTime,
            startDateTime: this.combineDateTime(date, slotStartTime),
            endDateTime: this.combineDateTime(date, slotEndTime),
          });
        }
      }
    }

    return slots;
  }

  // Helper to convert minutes to time string
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  // Helper to combine date and time
  combineDateTime(date, timeString) {
    const d = new Date(date);
    const [hours, minutes] = timeString.split(':').map(Number);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }
}

module.exports = new AvailabilityRepository();
