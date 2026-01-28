// models/MedicalExam.js
const mongoose = require("mongoose");

const medicalExamSchema = new mongoose.Schema(
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
    // Informations sur la demande
    examType: {
      type: String,
      enum: [
        "BLOOD_TEST",
        "URINE_TEST", 
        "X_RAY",
        "CT_SCAN",
        "MRI",
        "ULTRASOUND",
        "ECG",
        "EEG",
        "ENDOSCOPY",
        "COLONOSCOPY",
        "MAMMOGRAPHY",
        "OTHER",
      ],
      required: true,
    },
    examTypeLabel: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["NORMAL", "URGENT"],
      default: "NORMAL",
    },
    // Instructions et détails
    instructions: {
      type: String,
      default: "",
    },
    preparationNeeded: {
      type: String,
      default: "",
    },
    fastingRequired: {
      type: Boolean,
      default: false,
    },
    fastingDuration: {
      type: String,
      default: "", // Ex: "8 heures"
    },
    // Laboratoire/centre d'examen
    labName: {
      type: String,
      default: "",
    },
    labAddress: {
      type: String,
      default: "",
    },
    // Résultats
    results: [
      {
        fileName: {
          type: String,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          enum: ["PDF", "IMAGE", "DOCUMENT"],
          default: "PDF",
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        description: {
          type: String,
          default: "",
        },
      },
    ],
    // Suivi médical
    doctorComments: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    // Statut
    status: {
      type: String,
      enum: ["REQUESTED", "SCHEDULED", "COMPLETED", "RESULTS_UPLOADED", "REVIEWED"],
      default: "REQUESTED",
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    // Signature
    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    signedAt: {
      type: Date,
      default: null,
    },
    // Fichiers
    requestPdfUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index
medicalExamSchema.index({ patientId: 1, status: 1 });
medicalExamSchema.index({ doctorId: 1, createdAt: -1 });
medicalExamSchema.index({ appointmentId: 1 });

const MedicalExam = mongoose.model("MedicalExam", medicalExamSchema);

module.exports = MedicalExam;