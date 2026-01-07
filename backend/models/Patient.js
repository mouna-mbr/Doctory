const mongoose = require("mongoose");

const patientProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ["MALE", "FEMALE", "OTHER"],
    required: true,
  },
});

// Index for faster userId lookups
patientProfileSchema.index({ userId: 1 });

module.exports = mongoose.model("PatientProfile", patientProfileSchema);
