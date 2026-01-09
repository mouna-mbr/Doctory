const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // Format: "HH:mm" (e.g., "09:00")
      required: true,
    },
    endTime: {
      type: String, // Format: "HH:mm" (e.g., "17:00")
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
availabilitySchema.index({ doctorId: 1, date: 1 });
availabilitySchema.index({ date: 1, isAvailable: 1 });

// Validate time format
availabilitySchema.pre("save", function () {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(this.startTime)) {
    throw new Error("Invalid start time format. Use HH:mm");
  }
  
  if (!timeRegex.test(this.endTime)) {
    throw new Error("Invalid end time format. Use HH:mm");
  }
  
  // Validate end time is after start time
  const start = this.startTime.split(":").map(Number);
  const end = this.endTime.split(":").map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  
  if (endMinutes <= startMinutes) {
    throw new Error("End time must be after start time");
  }
});

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability;
