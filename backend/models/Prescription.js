// models/Prescription.js
const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
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
    // Informations médicales
    diagnosis: {
      type: String,
      default: "",
    },
    medications: [
      {
        name: {
          type: String,
          required: true,
        },
        dosage: {
          type: String,
          required: true, // Ex: "500mg"
        },
        frequency: {
          type: String,
          required: true, // Ex: "3 fois par jour"
        },
        duration: {
          type: String,
          required: true, // Ex: "7 jours"
        },
        instructions: {
          type: String,
          default: "",
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    medicalAdvice: {
      type: String,
      default: "",
    },
    recommendations: {
      type: String,
      default: "",
    },
    // Signature électronique
    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    signedAt: {
      type: Date,
      default: null,
    },
    signatureHash: {
      type: String,
      default: null,
    },
    // Statut
    status: {
      type: String,
      enum: ["DRAFT", "SIGNED", "SENT", "EXPIRED"],
      default: "DRAFT",
    },
    expiresAt: {
      type: Date,
      default: function() {
        const date = new Date();
        date.setDate(date.getDate() + 30); // Expire dans 30 jours
        return date;
      },
    },
    // Fichiers
    pdfUrl: {
      type: String,
      default: null,
    },
    qrCode: {
      type: String,
      default: null,
    },
    // Métadonnées
    isPrinted: {
      type: Boolean,
      default: false,
    },
    printedAt: {
      type: Date,
      default: null,
    },
    sharedWithPharmacies: [
      {
        pharmacyId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        sharedAt: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index pour les recherches fréquentes
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, status: 1 });
prescriptionSchema.index({ appointmentId: 1 }, { unique: true });

// Vérifier si l'ordonnance est valide
prescriptionSchema.methods.isValid = function() {
  return this.status === "SIGNED" && new Date() < this.expiresAt;
};

// Générer un ID unique pour QR Code
prescriptionSchema.methods.generateQRCodeData = function() {
  return JSON.stringify({
    prescriptionId: this._id,
    doctorId: this.doctorId,
    patientId: this.patientId,
    createdAt: this.createdAt,
    hash: this.signatureHash,
  });
};

const Prescription = mongoose.model("Prescription", prescriptionSchema);

module.exports = Prescription;