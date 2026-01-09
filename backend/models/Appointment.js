const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED"],
      default: "REQUESTED",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
appointmentSchema.index({ doctorId: 1, startDateTime: 1 });
appointmentSchema.index({ patientId: 1, startDateTime: 1 });
appointmentSchema.index({ status: 1 });

// Virtual to check if appointment is in the past
appointmentSchema.virtual("isPast").get(function () {
  return this.endDateTime < new Date();
});

// Validate that end time is after start time
appointmentSchema.pre("save", function () {
  if (this.endDateTime <= this.startDateTime) {
    throw new Error("End time must be after start time");
  }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
