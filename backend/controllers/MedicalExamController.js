// controllers/MedicalExamController.js
const MedicalExamService = require("../services/MedicalExamService");
const Appointment = require("../models/Appointment");

class MedicalExamController {
  // Créer une demande d'examen
  async createExamRequest(req, res) {
    try {
      const { appointmentId } = req.params;
      const examData = req.body;
      const doctorId = req.user.userId;

      // Vérifications
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Rendez-vous introuvable",
        });
      }

      if (appointment.doctorId.toString() !== doctorId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Seul le médecin du rendez-vous peut demander des examens",
        });
      }

      const exam = await MedicalExamService.createExamRequest(
        appointmentId,
        doctorId,
        appointment.patientId,
        examData
      );

      res.status(201).json({
        success: true,
        message: "Demande d'examen créée avec succès",
        data: exam,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Télécharger des résultats d'examen
  async uploadExamResults(req, res) {
    try {
      const { examId } = req.params;
      const files = req.files; // Middleware multer requis
      const uploaderId = req.user.userId;
      const uploaderRole = req.user.role;

      const exam = await MedicalExamService.uploadResults(
        examId,
        files,
        uploaderId,
        uploaderRole
      );

      res.status(200).json({
        success: true,
        message: "Résultats téléchargés avec succès",
        data: exam,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Marquer les résultats comme revus
  async reviewExamResults(req, res) {
    try {
      const { examId } = req.params;
      const { comments } = req.body;
      const doctorId = req.user.userId;

      const exam = await MedicalExamService.reviewResults(
        examId,
        doctorId,
        comments
      );

      res.status(200).json({
        success: true,
        message: "Résultats revus et commentés",
        data: exam,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }




  // Obtenir les examens d'un patient
  async getPatientExams(req, res) {
    try {
      const { patientId } = req.params;
      const userId = req.user.userId;
      const { status, type } = req.query;

      // Vérifier les permissions
      if (req.user.role === "PATIENT" && userId.toString() !== patientId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Vous ne pouvez voir que vos propres examens",
        });
      }

      const exams = await MedicalExamService.getPatientExams(patientId, {
        status,
        type,
      });

      res.status(200).json({
        success: true,
        count: exams.length,
        data: exams,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new MedicalExamController();