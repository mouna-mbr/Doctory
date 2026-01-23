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
      enum: ["REQUESTED", "CONFIRMED", "CANCELLED", "COMPLETED", "AWAITING_PAYMENT"],
      default: "REQUESTED",
      required: true,
    },
    videoRoomId: {
      type: String,
      default: null,
    },
    // Champs de paiement ajoutés
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: ["CARD", "MOBILE_MONEY", "BANK_TRANSFER", null],
      default: null,
    },
    paymentId: {
      type: String, // ID de transaction Stripe/autre
      default: null,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    stripeSessionId: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requêtes de paiement
appointmentSchema.index({ paymentStatus: 1 });
appointmentSchema.index({ status: 1, paymentStatus: 1 });

// Virtual pour vérifier si le paiement est requis
appointmentSchema.virtual("requiresPayment").get(function () {
  return this.status === "CONFIRMED" && this.paymentStatus !== "PAID";
});

// Virtual pour vérifier si l'accès à la vidéo est autorisé
appointmentSchema.virtual("canAccessVideo").get(function () {
  const now = new Date();
  const appointmentTime = new Date(this.startDateTime);
  const timeDiff = appointmentTime - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return this.status === "CONFIRMED" && 
         this.paymentStatus === "PAID" &&
         hoursDiff >= -0.25 && // 15 minutes avant
         hoursDiff <= 2; // Jusqu'à 2 heures après
});

// Validate that end time is after start time
appointmentSchema.pre("save", function () {
  if (this.endDateTime <= this.startDateTime) {
    throw new Error("End time must be after start time");
  }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;