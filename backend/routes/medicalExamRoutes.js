// routes/medicalExamRoutes.js
const express = require("express");
const router = express.Router();
const MedicalExamController = require("../controllers/MedicalExamController");
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");
const multer = require("multer");
// routes/medicalExamRoutes.js - AJOUTER en haut du fichier :
const MedicalExam = require("../models/MedicalExam");
const Appointment = require("../models/Appointment");

// Configuration de multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/exam-results/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé"), false);
    }
  },
});
// Route temporaire pour téléchargement PDF avec token dans l'URL
router.get("/exams/:examId/download/:token", async (req, res) => {
  try {
    const { examId, token } = req.params;
    
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
    
    const exam = await MedicalExam.findById(examId)
      .populate("doctorId", "fullName specialty licenseNumber")
      .populate("patientId", "fullName dateOfBirth")
      .populate("appointmentId", "startDateTime reason");
    
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Examen introuvable",
      });
    }
    
    // Vérifier les permissions
    const canAccess = 
      decoded.role === "DOCTOR" && exam.doctorId._id.toString() === decoded.userId.toString() ||
      decoded.role === "PATIENT" && exam.patientId._id.toString() === decoded.userId.toString() ||
      decoded.role === "ADMIN";
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cet examen",
      });
    }
    
    // Générer le PDF
    const PDFService = require("../services/PDFService");
    const pdfBuffer = await PDFService.generateExamRequestPDF(exam);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="demande-examen-${examId}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating exam PDF:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
router.use(authMiddleware);

// Créer une demande d'examen (médecin)
router.post(
  "/appointment/:appointmentId/exam",
  roleMiddleware("DOCTOR"),
  MedicalExamController.createExamRequest
);

// Télécharger des résultats (patient ou médecin)
router.post(
  "/exams/:examId/upload",
  roleMiddleware("PATIENT", "DOCTOR"),
  upload.array("files", 5), // Max 5 fichiers
  MedicalExamController.uploadExamResults
);

// Revoyer les résultats (médecin)
router.post(
  "/exams/:examId/review",
  roleMiddleware("DOCTOR"),
  MedicalExamController.reviewExamResults
);

// Obtenir les examens d'un patient
router.get(
  "/patients/:patientId/exams",
  roleMiddleware("DOCTOR", "PATIENT", "ADMIN"),
  MedicalExamController.getPatientExams
);

// Télécharger une demande d'examen en PDF
// Ajouter cette route APRÈS les autres routes

// Obtenir tous les examens de l'utilisateur connecté
router.get(
  "/my-exams",
  roleMiddleware("PATIENT", "DOCTOR", "ADMIN"),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      
      let exams;
      if (userRole === "PATIENT") {
        // Patient: obtenir ses propres examens
        exams = await MedicalExam.find({ patientId: userId })
          .populate("doctorId", "fullName specialty")
          .populate("appointmentId", "startDateTime reason")
          .sort({ createdAt: -1 });
      } else if (userRole === "DOCTOR") {
        // Médecin: obtenir les examens qu'il a prescrits
        exams = await MedicalExam.find({ doctorId: userId })
          .populate("patientId", "fullName email")
          .populate("appointmentId", "startDateTime reason")
          .sort({ createdAt: -1 });
      }
      
      res.status(200).json({
        success: true,
        data: exams,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Obtenir les examens par rendez-vous
router.get(
  "/appointment/:appointmentId/exams",
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
      
      const exams = await MedicalExam.find({ appointmentId })
        .populate("doctorId", "fullName specialty")
        .populate("patientId", "fullName")
        .sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        data: exams,
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