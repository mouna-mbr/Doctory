const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  speciality: {
    type: String,
    required: true,
    trim: true,
  },
  yearsOfExperience: {
    type: Number,
    required: true,
    min: 0,
  },
  professionalLicenseNumber: {
    type: String,
    required: true,
    trim: true,
  },
  licenseDocumentUrl: {
    type: String,
    default: null,
  },
  consultationPrice: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    min: 0,
  },
  teleconsultationEnabled: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
});

// Index for faster userId lookups
doctorProfileSchema.index({ userId: 1 });

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
