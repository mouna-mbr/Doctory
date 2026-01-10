const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["ADMIN", "DOCTOR", "PATIENT", "PHARMACIST"],
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  // Doctor-specific fields
  specialty: {
    type: String,
    default: null,
  },
  yearsOfExperience: {
    type: Number,
    default: null,
  },
  consultationPrice: {
    type: Number,
    default: null,
  },
  // Patient-specific fields
  dateOfBirth: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: {
      values: ["male", "female"],
      message: '{VALUE} is not a valid gender'
    },
    default: null,
  },
  // Pharmacist-specific fields
  pharmacyName: {
    type: String,
    default: null,
  },
  pharmacyAddress: {
    type: String,
    default: null,
  },
});

// Index for faster email lookups
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
