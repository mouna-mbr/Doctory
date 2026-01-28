const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  // Générer une demande d'examen en PDF
  static async generateExamRequestPDF(exam) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Demande d'examen - ${exam.examTypeLabel}`,
            Author: 'Système Médical',
            Subject: 'Demande d\'examen médical',
            Keywords: 'examen, médical, demande, prescription',
            Creator: 'Système Médical',
            CreationDate: new Date()
          }
        });

        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // En-tête
        doc.fontSize(20).text('DEMANDE D\'EXAMEN MÉDICAL', { align: 'center' });
        doc.moveDown();
        
        // Ligne de séparation
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        
        // Informations générales
        doc.fontSize(14).text('Informations générales', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(12).text(`Date de demande: ${new Date(exam.createdAt).toLocaleDateString('fr-FR')}`);
        doc.text(`Type d'examen: ${exam.examTypeLabel}`);
        doc.text(`Priorité: ${exam.priority === 'URGENT' ? 'URGENTE' : 'NORMALE'}`);
        doc.text(`Statut: ${this.getStatusLabel(exam.status)}`);
        doc.moveDown();
        
        // Informations du médecin
        doc.fontSize(14).text('Médecin prescripteur', { underline: true });
        doc.moveDown(0.5);
        
        if (exam.doctorId) {
          doc.fontSize(12).text(`Dr. ${exam.doctorId.fullName}`);
          doc.text(`Spécialité: ${exam.doctorId.specialty || 'Non spécifié'}`);
          if (exam.doctorId.licenseNumber) {
            doc.text(`N° de licence: ${exam.doctorId.licenseNumber}`);
          }
        }
        doc.moveDown();
        
        // Informations du patient
        doc.fontSize(14).text('Informations du patient', { underline: true });
        doc.moveDown(0.5);
        
        if (exam.patientId) {
          doc.fontSize(12).text(`Nom: ${exam.patientId.fullName}`);
          doc.text(`Date de naissance: ${exam.patientId.dateOfBirth ? new Date(exam.patientId.dateOfBirth).toLocaleDateString('fr-FR') : 'Non spécifiée'}`);
        }
        doc.moveDown();
        
        // Raison et instructions
        doc.fontSize(14).text('Raison de l\'examen', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).text(exam.reason || 'Non spécifiée');
        doc.moveDown();
        
        if (exam.instructions) {
          doc.fontSize(14).text('Instructions spécifiques', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12).text(exam.instructions);
          doc.moveDown();
        }
        
        // Préparation requise
        if (exam.preparationNeeded) {
          doc.fontSize(14).text('Préparation requise', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12).text(exam.preparationNeeded);
          doc.moveDown();
        }
        
        if (exam.fastingRequired) {
          doc.fontSize(12).text(`Jeûne: ${exam.fastingDuration || 'Requis (durée non spécifiée)'}`);
          doc.moveDown();
        }
        
        // Laboratoire
        if (exam.labName || exam.labAddress) {
          doc.fontSize(14).text('Laboratoire', { underline: true });
          doc.moveDown(0.5);
          if (exam.labName) {
            doc.fontSize(12).text(`Nom: ${exam.labName}`);
          }
          if (exam.labAddress) {
            doc.fontSize(12).text(`Adresse: ${exam.labAddress}`);
          }
          doc.moveDown();
        }
        
        // Résultats (si disponibles)
        if (exam.results && exam.results.length > 0) {
          doc.fontSize(14).text('Résultats disponibles', { underline: true });
          doc.moveDown(0.5);
          
          exam.results.forEach((result, index) => {
            doc.fontSize(12).text(`${index + 1}. ${result.fileName}`);
            if (result.uploadedAt) {
              doc.fontSize(10).text(`   Téléchargé le: ${new Date(result.uploadedAt).toLocaleDateString('fr-FR')}`);
            }
          });
          doc.moveDown();
        }
        
        // Commentaires du médecin
        if (exam.doctorComments) {
          doc.fontSize(14).text('Commentaires du médecin', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12).text(exam.doctorComments);
          doc.moveDown();
        }
        
        // Pied de page
        doc.moveDown(2);
        doc.fontSize(10).text('Document généré automatiquement par le Système Médical', { align: 'center' });
        doc.text(`ID de l'examen: ${exam._id}`, { align: 'center' });
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Générer une ordonnance en PDF
  static async generatePrescriptionPDF(prescription) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Ordonnance médicale - ${prescription._id}`,
            Author: 'Système Médical',
            Subject: 'Ordonnance médicale',
            Keywords: 'ordonnance, médical, prescription, médicaments',
            Creator: 'Système Médical',
            CreationDate: new Date()
          }
        });

        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // En-tête
        doc.fontSize(20).text('ORDONNANCE MÉDICALE', { align: 'center' });
        doc.moveDown();
        
        // Ligne de séparation
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        
        // Informations générales
        doc.fontSize(14).text('Informations générales', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(12).text(`Date: ${new Date(prescription.createdAt).toLocaleDateString('fr-FR')}`);
        doc.text(`N° d'ordonnance: ${prescription._id.toString().slice(-6)}`);
        doc.text(`Statut: ${this.getPrescriptionStatusLabel(prescription.status)}`);
        doc.text(`Valide jusqu'au: ${new Date(prescription.expiresAt).toLocaleDateString('fr-FR')}`);
        doc.moveDown();
        
        // Informations du médecin
        doc.fontSize(14).text('Médecin prescripteur', { underline: true });
        doc.moveDown(0.5);
        
        if (prescription.doctorId) {
          doc.fontSize(12).text(`Dr. ${prescription.doctorId.fullName}`);
          doc.text(`Spécialité: ${prescription.doctorId.specialty || 'Non spécifié'}`);
          if (prescription.doctorId.licenseNumber) {
            doc.text(`N° de licence: ${prescription.doctorId.licenseNumber}`);
          }
          if (prescription.signedAt) {
            doc.text(`Signée le: ${new Date(prescription.signedAt).toLocaleDateString('fr-FR')}`);
          }
        }
        doc.moveDown();
        
        // Informations du patient
        doc.fontSize(14).text('Informations du patient', { underline: true });
        doc.moveDown(0.5);
        
        if (prescription.patientId) {
          doc.fontSize(12).text(`Nom: ${prescription.patientId.fullName}`);
          if (prescription.patientId.dateOfBirth) {
            doc.text(`Date de naissance: ${new Date(prescription.patientId.dateOfBirth).toLocaleDateString('fr-FR')}`);
          }
        }
        doc.moveDown();
        
        // Diagnostic
        if (prescription.diagnosis) {
          doc.fontSize(14).text('Diagnostic', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12).text(prescription.diagnosis);
          doc.moveDown();
        }
        
        // Médicaments
        doc.fontSize(14).text('Médicaments prescrits', { underline: true });
        doc.moveDown(0.5);
        
        if (prescription.medications && prescription.medications.length > 0) {
          prescription.medications.forEach((med, index) => {
            doc.fontSize(12).text(`${index + 1}. ${med.name} - ${med.dosage}`);
            doc.fontSize(11).text(`   Posologie: ${med.frequency} pendant ${med.duration}`);
            if (med.quantity && med.quantity > 1) {
              doc.fontSize(11).text(`   Quantité: ${med.quantity} unités`);
            }
            if (med.instructions) {
              doc.fontSize(11).text(`   Instructions: ${med.instructions}`);
            }
            doc.moveDown(0.5);
          });
        } else {
          doc.fontSize(12).text('Aucun médicament prescrit');
        }
        doc.moveDown();
        
        // Conseils médicaux
        if (prescription.medicalAdvice) {
          doc.fontSize(14).text('Conseils médicaux', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12).text(prescription.medicalAdvice);
          doc.moveDown();
        }
        
        // Recommandations
        if (prescription.recommendations) {
          doc.fontSize(14).text('Recommandations', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12).text(prescription.recommendations);
          doc.moveDown();
        }
        
        // Signature
        doc.moveDown(2);
        if (prescription.signedAt) {
          doc.fontSize(12).text('Signature électronique:', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(11).text(`Signée le: ${new Date(prescription.signedAt).toLocaleDateString('fr-FR')}`);
          doc.text(`Par: Dr. ${prescription.doctorId?.fullName || 'Médecin'}`);
        } else {
          doc.fontSize(12).text('Ordonnance non signée', { color: 'red' });
        }
        
        // Pied de page
        doc.moveDown(2);
        doc.fontSize(10).text('Document généré automatiquement par le Système Médical', { align: 'center' });
        doc.text(`ID de l'ordonnance: ${prescription._id}`, { align: 'center' });
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`, { align: 'center' });
        
        // QR Code placeholder (vous pouvez ajouter un vrai QR code ici)
        doc.moveDown();
        doc.fontSize(8).text('QR Code pour vérification disponible dans l\'application', { align: 'center' });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Helper pour les statuts d'examen
  static getStatusLabel(status) {
    const statusLabels = {
      'REQUESTED': 'Demandé',
      'SCHEDULED': 'Programmé',
      'COMPLETED': 'Terminé',
      'RESULTS_UPLOADED': 'Résultats téléchargés',
      'REVIEWED': 'Révoyé'
    };
    return statusLabels[status] || status;
  }
  
  // Helper pour les statuts d'ordonnance
  static getPrescriptionStatusLabel(status) {
    const statusLabels = {
      'DRAFT': 'Brouillon',
      'SIGNED': 'Signée',
      'SENT': 'Envoyée',
      'EXPIRED': 'Expirée'
    };
    return statusLabels[status] || status;
  }
}

module.exports = PDFService;