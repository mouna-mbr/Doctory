const mongoose = require("mongoose");

const pharmacistProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  pharmacyName: {
    type: String,
    required: true,
    trim: true,
  },
  pharmacyAddress: {
    type: String,
    required: true,
    trim: true,
  },
  pharmacyPhone: {
    type: String,
    required: true,
    trim: true,
  },
  licenseNumber: {
    type: String,
    required: true,
    trim: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
});

// Index for faster userId lookups
pharmacistProfileSchema.index({ userId: 1 });

module.exports = mongoose.model("PharmacistProfile", pharmacistProfileSchema);
