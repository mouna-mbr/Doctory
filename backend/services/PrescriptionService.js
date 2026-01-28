// services/PrescriptionService.js
const Prescription = require("../models/Prescription");
const NotificationService = require("./NotificationService");
const PDFService = require("./PDFService");
const QRCodeService = require("./QRCodeService");
const crypto = require("crypto");

class PrescriptionService {
  // Créer une ordonnance
  async createPrescription(appointmentId, doctorId, patientId, data) {
    // Vérifier s'il existe déjà une ordonnance pour ce rendez-vous
    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
      throw new Error("Une ordonnance existe déjà pour ce rendez-vous");
    }

    const prescription = await Prescription.create({
      appointmentId,
      doctorId,
      patientId,
      diagnosis: data.diagnosis || "",
      medications: data.medications || [],
      medicalAdvice: data.medicalAdvice || "",
      recommendations: data.recommendations || "",
      status: "DRAFT",
    });

    return prescription;
  }

  // Signer une ordonnance
  async signPrescription(prescriptionId, doctorId) {
    const prescription = await Prescription.findById(prescriptionId);
    
    if (!prescription) {
      throw new Error("Ordonnance introuvable");
    }

    if (prescription.doctorId.toString() !== doctorId.toString()) {
      throw new Error("Seul le médecin prescripteur peut signer cette ordonnance");
    }

    if (prescription.status === "SIGNED") {
      throw new Error("Cette ordonnance est déjà signée");
    }

    if (!prescription.medications || prescription.medications.length === 0) {
      throw new Error("L'ordonnance doit contenir au moins un médicament");
    }

    // Générer un hash de signature
    const signatureData = {
      prescriptionId: prescription._id.toString(),
      doctorId: prescription.doctorId.toString(),
      patientId: prescription.patientId.toString(),
      timestamp: Date.now(),
    };

    const signatureHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(signatureData))
      .digest("hex");

    // Générer le PDF
    const pdfBuffer = await PDFService.generatePrescriptionPDF(prescription);
    
    // Générer le QR Code
    const qrCodeData = prescription.generateQRCodeData();
    const qrCodeBuffer = await QRCodeService.generateQRCode(qrCodeData);

    // Mettre à jour l'ordonnance
    prescription.status = "SIGNED";
    prescription.signedBy = doctorId;
    prescription.signedAt = new Date();
    prescription.signatureHash = signatureHash;
    
    // Ici, tu dois sauvegarder le PDF et le QR Code dans ton storage (AWS S3, etc.)
    // Exemple:
    // const pdfUrl = await StorageService.uploadPDF(pdfBuffer, `prescriptions/${prescriptionId}.pdf`);
    // const qrCodeUrl = await StorageService.uploadImage(qrCodeBuffer, `qrcodes/${prescriptionId}.png`);
    
    // Pour l'exemple, on utilise des URLs mock
    prescription.pdfUrl = `/api/prescriptions/${prescriptionId}/pdf`;
    prescription.qrCode = qrCodeData; // Stocker les données ou l'URL

    await prescription.save();

    // Envoyer la notification au patient
    await NotificationService.createPrescriptionNotification(
      prescription.patientId,
      prescription.doctorId,
      prescription._id
    );

    return prescription;
  }

  // Obtenir les ordonnances d'un patient
  async getPatientPrescriptions(patientId, filters = {}) {
    const query = { patientId };

    if (filters.status) {
      query.status = filters.status;
    }

    const limit = parseInt(filters.limit) || 50;
    const offset = parseInt(filters.offset) || 0;

    const prescriptions = await Prescription.find(query)
      .populate("doctorId", "fullName specialty profileImage")
      .populate("appointmentId", "startDateTime")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return prescriptions;
  }

  // Générer le PDF
  async generatePDF(prescriptionId, userId, userRole) {
    const prescription = await Prescription.findById(prescriptionId)
      .populate("doctorId", "fullName specialty licenseNumber")
      .populate("patientId", "fullName dateOfBirth gender");

    if (!prescription) {
      throw new Error("Ordonnance introuvable");
    }

    // Vérifier les permissions
    const isPatient = prescription.patientId._id.toString() === userId.toString();
    const isDoctor = prescription.doctorId._id.toString() === userId.toString();
    const isAdmin = userRole === "ADMIN";

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new Error("Accès non autorisé à cette ordonnance");
    }

    // Vérifier si l'ordonnance est signée
    if (prescription.status !== "SIGNED") {
      throw new Error("L'ordonnance n'est pas encore signée");
    }

    // Marquer comme imprimée si c'est le patient
    if (isPatient && !prescription.isPrinted) {
      prescription.isPrinted = true;
      prescription.printedAt = new Date();
      await prescription.save();
    }

    // Retourner le PDF (dans la vraie implémentation, lire depuis le storage)
    const pdfBuffer = await PDFService.generatePrescriptionPDF(prescription);
    return pdfBuffer;
  }

  // Partager avec une pharmacie
  async shareWithPharmacy(prescriptionId, doctorId, pharmacyId) {
    const prescription = await Prescription.findById(prescriptionId);
    
    if (!prescription) {
      throw new Error("Ordonnance introuvable");
    }

    if (prescription.doctorId.toString() !== doctorId.toString()) {
      throw new Error("Seul le médecin prescripteur peut partager l'ordonnance");
    }

    if (prescription.status !== "SIGNED") {
      throw new Error("Seule une ordonnance signée peut être partagée");
    }

    // Vérifier si déjà partagée avec cette pharmacie
    const alreadyShared = prescription.sharedWithPharmacies.some(
      (share) => share.pharmacyId.toString() === pharmacyId.toString()
    );

    if (!alreadyShared) {
      prescription.sharedWithPharmacies.push({
        pharmacyId,
        sharedAt: new Date(),
      });

      await prescription.save();

      // Envoyer une notification à la pharmacie
      // (implémenter selon tes besoins)
    }

    return prescription;
  }
}

module.exports = new PrescriptionService();