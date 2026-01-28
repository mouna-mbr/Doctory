// services/MedicalExamService.js
const MedicalExam = require("../models/MedicalExam");
const NotificationService = require("./NotificationService");
const PDFService = require("./PDFService");
const Appointment = require("../models/Appointment");

class MedicalExamService {
  // Créer une demande d'examen
  async createExamRequest(appointmentId, doctorId, patientId, data) {
    const exam = await MedicalExam.create({
      appointmentId,
      doctorId,
      patientId,
      examType: data.examType,
      examTypeLabel: data.examTypeLabel,
      reason: data.reason,
      priority: data.priority || "NORMAL",
      instructions: data.instructions || "",
      preparationNeeded: data.preparationNeeded || "",
      fastingRequired: data.fastingRequired || false,
      fastingDuration: data.fastingDuration || "",
      labName: data.labName || "",
      labAddress: data.labAddress || "",
      status: "REQUESTED",
    });

    // Générer le PDF de demande
    const pdfBuffer = await PDFService.generateExamRequestPDF(exam);
    // Sauvegarder le PDF (exemple)
    // exam.requestPdfUrl = await StorageService.uploadPDF(pdfBuffer, `exam-requests/${exam._id}.pdf`);
    
    await exam.save();

    // Envoyer la notification au patient
    await NotificationService.createExamRequestNotification(
      patientId,
      doctorId,
      exam._id,
      exam.examTypeLabel
    );

    return exam;
  }

  // Télécharger des résultats
  async uploadResults(examId, files, uploaderId, uploaderRole) {
    const exam = await MedicalExam.findById(examId);
    
    if (!exam) {
      throw new Error("Examen introuvable");
    }

    // Vérifier les permissions
    if (uploaderRole === "PATIENT" && exam.patientId.toString() !== uploaderId.toString()) {
      throw new Error("Vous ne pouvez télécharger que vos propres résultats");
    }

    const results = [];
    
    // Traiter chaque fichier
    for (const file of files) {
      results.push({
        fileName: file.originalname,
        fileUrl: file.path, // Chemin temporaire, à uploader vers un storage
        fileType: this.getFileType(file.mimetype),
        uploadedBy: uploaderId,
        description: file.originalname,
      });
    }

    exam.results = [...exam.results, ...results];
    
    // Mettre à jour le statut
    if (exam.status === "COMPLETED" || exam.status === "REQUESTED") {
      exam.status = "RESULTS_UPLOADED";
    }

    await exam.save();

    // Notifier le médecin
    if (uploaderRole === "PATIENT") {
      await NotificationService.createExamResultsNotification(
        exam.doctorId,
        exam.patientId,
        exam._id
      );
    }

    return exam;
  }

  // Revoyer les résultats
  async reviewResults(examId, doctorId, comments) {
    const exam = await MedicalExam.findById(examId);
    
    if (!exam) {
      throw new Error("Examen introuvable");
    }

    if (exam.doctorId.toString() !== doctorId.toString()) {
      throw new Error("Seul le médecin prescripteur peut revoir les résultats");
    }

    if (exam.status !== "RESULTS_UPLOADED") {
      throw new Error("Les résultats doivent d'abord être téléchargés");
    }

    exam.doctorComments = comments;
    exam.reviewedBy = doctorId;
    exam.reviewedAt = new Date();
    exam.status = "REVIEWED";

    await exam.save();

    // Notifier le patient
    await NotificationService.createExamReviewedNotification(
      exam.patientId,
      doctorId,
      exam._id
    );

    return exam;
  }

  // Obtenir les examens d'un patient
  async getPatientExams(patientId, filters = {}) {
    const query = { patientId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type) {
      query.examType = filters.type;
    }

    const exams = await MedicalExam.find(query)
      .populate("doctorId", "fullName specialty")
      .populate("appointmentId", "startDateTime")
      .sort({ createdAt: -1 });

    return exams;
  }

  // Méthode utilitaire pour déterminer le type de fichier
  getFileType(mimetype) {
    if (mimetype.includes("pdf")) return "PDF";
    if (mimetype.includes("image")) return "IMAGE";
    return "DOCUMENT";
  }
}

module.exports = new MedicalExamService();