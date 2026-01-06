const mongoose = require("mongoose");

const adminProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  permissions: {
    type: [String],
    default: [],
  },
});

// Index for faster userId lookups
adminProfileSchema.index({ userId: 1 });

module.exports = mongoose.model("AdminProfile", adminProfileSchema);
