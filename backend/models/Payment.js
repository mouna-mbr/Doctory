const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: ["CARD", "MOBILE_MONEY", "BANK_TRANSFER"],
      required: true,
    },
    paymentGateway: {
      type: String,
      enum: ["STRIPE", "PAYPAL", "ORANGE_MONEY", "MTN_MOBILE_MONEY", null],
      default: null,
    },
    gatewayTransactionId: {
      type: String,
      default: null,
    },
    receiptUrl: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ patientId: 1 });
paymentSchema.index({ doctorId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Payment", paymentSchema);