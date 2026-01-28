// routes/prescriptionRoutes.js
const express = require("express");
const router = express.Router();
const PrescriptionController = require("../controllers/prescriptionController");
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");
// routes/prescriptionRoutes.js - AJOUTER en haut du fichier :
const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
// Toutes les routes nécessitent une authentification


router.get("/prescriptions/:prescriptionId/download/:token", async (req, res) => {
  try {
    const { prescriptionId, token } = req.params;
    
    // Vérifier le token
    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }
    
    const prescription = await Prescription.findById(prescriptionId)
      .populate("doctorId", "fullName specialty licenseNumber")
      .populate("patientId", "fullName dateOfBirth")
      .populate("appointmentId", "startDateTime reason");
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Ordonnance introuvable",
      });
    }
    
    // Vérifier les permissions
    const canAccess = 
      decoded.role === "DOCTOR" && prescription.doctorId._id.toString() === decoded.userId.toString() ||
      decoded.role === "PATIENT" && prescription.patientId._id.toString() === decoded.userId.toString() ||
      decoded.role === "ADMIN" ||
      (decoded.role === "PHARMACIST" && prescription.sharedWithPharmacies.includes(decoded.userId));
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette ordonnance",
      });
    }
    
    // Générer le PDF
    const PDFService = require("../services/PDFService");
    const pdfBuffer = await PDFService.generatePrescriptionPDF(prescription);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ordonnance-${prescriptionId}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.use(authMiddleware);

// Créer une ordonnance (médecin seulement)
router.post(
  "/appointment/:appointmentId/prescription",
  roleMiddleware("DOCTOR"),
  PrescriptionController.createPrescription
);

// Signer une ordonnance (médecin seulement)
router.post(
  "/prescriptions/:prescriptionId/sign",
  roleMiddleware("DOCTOR"),
  PrescriptionController.signPrescription
);

// Obtenir les ordonnances d'un patient
router.get(
  "/patients/:patientId/prescriptions",
  roleMiddleware("DOCTOR", "PATIENT", "ADMIN"),
  PrescriptionController.getPatientPrescriptions
);

// Ajouter cette route APRÈS les autres routes
// Route temporaire pour téléchargement PDF avec token dans l'URL

// Partager avec une pharmacie
router.post(
  "/prescriptions/:prescriptionId/share",
  roleMiddleware("DOCTOR"),
  PrescriptionController.shareWithPharmacy
);

// Vérifier une ordonnance via QR Code (public)
router.get("/prescriptions/:prescriptionId/verify", async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { qrData } = req.query;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("doctorId", "fullName specialty")
      .populate("patientId", "fullName");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Ordonnance introuvable",
      });
    }

    // Vérifier le QR Code
    const qrCodeService = require("../services/QRCodeService");
    const verification = await qrCodeService.verifyQRCode(qrData, prescriptionId);

    res.status(200).json({
      success: verification.valid,
      data: {
        prescription,
        verification,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Obtenir toutes les prescriptions de l'utilisateur connecté
router.get(
  "/my-prescriptions",
  roleMiddleware("PATIENT", "DOCTOR", "ADMIN", "PHARMACIST"),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      
      let prescriptions;
      if (userRole === "PATIENT") {
        prescriptions = await Prescription.find({ patientId: userId })
          .populate("doctorId", "fullName specialty")
          .populate("appointmentId", "startDateTime reason")
          .sort({ createdAt: -1 });
      } else if (userRole === "DOCTOR") {
        prescriptions = await Prescription.find({ doctorId: userId })
          .populate("patientId", "fullName email")
          .populate("appointmentId", "startDateTime reason")
          .sort({ createdAt: -1 });
      } else if (userRole === "PHARMACIST") {
        // Pharmacien: voir les prescriptions partagées
        prescriptions = await Prescription.find({
          sharedWithPharmacies: { $in: [userId] },
          status: "SIGNED"
        })
        .populate("doctorId", "fullName specialty licenseNumber")
        .populate("patientId", "fullName dateOfBirth")
        .sort({ createdAt: -1 });
      }
      
      res.status(200).json({
        success: true,
        data: prescriptions,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Obtenir les prescriptions par rendez-vous
router.get(
  "/appointment/:appointmentId/prescriptions",
  roleMiddleware("DOCTOR", "PATIENT", "ADMIN"),
  async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;
      
      // Vérifier l'accès au rendez-vous
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Rendez-vous introuvable",
        });
      }
      
      // Vérifier les permissions
      if (userRole === "PATIENT" && appointment.patientId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }
      
      if (userRole === "DOCTOR" && appointment.doctorId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé",
        });
      }
      
      const prescriptions = await Prescription.find({ appointmentId })
        .populate("doctorId", "fullName specialty")
        .populate("patientId", "fullName")
        .sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        data: prescriptions,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;