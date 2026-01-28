// controllers/PrescriptionController.js
const PrescriptionService = require("../services/PrescriptionService");
const Appointment = require("../models/Appointment");

class PrescriptionController {
  // Créer une ordonnance (brouillon)
  async createPrescription(req, res) {
    try {
      const { appointmentId } = req.params;
      const prescriptionData = req.body;
      const doctorId = req.user.userId;

      // Vérifier que c'est le médecin du rendez-vous
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
          message: "Seul le médecin du rendez-vous peut créer une ordonnance",
        });
      }

      if (appointment.status !== "COMPLETED") {
        return res.status(400).json({
          success: false,
          message: "Le rendez-vous doit être terminé pour créer une ordonnance",
        });
      }

      const prescription = await PrescriptionService.createPrescription(
        appointmentId,
        doctorId,
        appointment.patientId,
        prescriptionData
      );

      res.status(201).json({
        success: true,
        message: "Ordonnance créée avec succès",
        data: prescription,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Signer une ordonnance
  async signPrescription(req, res) {
    try {
      const { prescriptionId } = req.params;
      const doctorId = req.user.userId;

      const prescription = await PrescriptionService.signPrescription(
        prescriptionId,
        doctorId
      );

      res.status(200).json({
        success: true,
        message: "Ordonnance signée avec succès",
        data: prescription,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Obtenir les ordonnances d'un patient
  async getPatientPrescriptions(req, res) {
    try {
      const userId = req.user.userId;
      const { patientId } = req.params;
      const { status, limit, offset } = req.query;

      // Vérifier les permissions
      if (req.user.role === "PATIENT" && userId.toString() !== patientId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Vous ne pouvez voir que vos propres ordonnances",
        });
      }

      const prescriptions = await PrescriptionService.getPatientPrescriptions(
        patientId,
        { status, limit, offset }
      );

      res.status(200).json({
        success: true,
        count: prescriptions.length,
        data: prescriptions,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Télécharger une ordonnance en PDF
  async downloadPrescription(req, res) {
    try {
      const { prescriptionId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;
      
      console.log(`[PDF Download] User ${userId} (${userRole}) requesting prescription ${prescriptionId}`);
      
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
        userRole === "DOCTOR" && prescription.doctorId._id.toString() === userId.toString() ||
        userRole === "PATIENT" && prescription.patientId._id.toString() === userId.toString() ||
        userRole === "ADMIN" ||
        (userRole === "PHARMACIST" && prescription.sharedWithPharmacies.includes(userId));
      
      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: "Accès non autorisé à cette ordonnance",
        });
      }
      
      // Générer le PDF
      const PDFService = require("../services/PDFService");
      const pdfBuffer = await PDFService.generatePrescriptionPDF(prescription);

      // Configurer les headers pour le téléchargement
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
  }
  // Partager avec une pharmacie
  async shareWithPharmacy(req, res) {
    try {
      const { prescriptionId } = req.params;
      const { pharmacyId } = req.body;
      const doctorId = req.user.userId;

      const prescription = await PrescriptionService.shareWithPharmacy(
        prescriptionId,
        doctorId,
        pharmacyId
      );

      res.status(200).json({
        success: true,
        message: "Ordonnance partagée avec la pharmacie",
        data: prescription,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PrescriptionController();