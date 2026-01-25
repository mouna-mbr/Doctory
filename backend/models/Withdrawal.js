// models/Withdrawal.js (NOUVEAU FICHIER)
const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100 // Minimum 100 DT
  },
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
    default: "PENDING"
  },
  method: {
    type: String,
    enum: ["BANK_TRANSFER", "MOBILE_MONEY"],
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  transactionId: {
    type: String,
    default: null
  },
  fees: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ""
  },
  processedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes pour performances
withdrawalSchema.index({ doctorId: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Withdrawal", withdrawalSchema);