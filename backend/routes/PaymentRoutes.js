const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const WalletController = require("../controllers/WalletController");
const Payment = require("../models/Payment");

// server/routes/payments.js
const PDFDocument = require('pdfkit');
// Middleware de vérification pour les patients uniquement sur certaines routes
const patientOnly = (req, res, next) => {
  if (req.user.role !== "PATIENT") {
    return res.status(403).json({
      success: false,
      message: "Réservé aux patients",
    });
  }
  next();
};

// Middleware pour les webhooks (pas d'authentification standard)
const rawBodyMiddleware = (req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    req.rawBody = req.body.toString();
    next();
  } else {
    next();
  }
};

router.use(rawBodyMiddleware);

// Toutes les routes sauf webhook nécessitent une authentification
router.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    return next();
  }
  authMiddleware(req, res, next);
});

// Webhook Stripe (POST sans auth)
router.post("/webhook", PaymentController.stripeWebhook);

// Créer une session de paiement Stripe (patient seulement)
router.post("/stripe/:appointmentId", patientOnly, PaymentController.createStripeSession);

// Créer un paiement mobile money (patient seulement)
router.post("/mobile-money/:appointmentId", patientOnly, PaymentController.createMobileMoneyPayment);

// Vérifier un paiement Stripe
router.post("/verify", PaymentController.verifyStripePayment);

// Obtenir le statut d'un paiement
router.get("/status/:appointmentId", PaymentController.getPaymentStatus);

// Effectuer un remboursement (docteur ou admin)
router.post("/refund/:appointmentId", PaymentController.refundPayment);






// Route pour générer un PDF de reçu
// Dans paymentRoutes.js - Route PDF améliorée

// Dans paymentRoutes.js - Route PDF avec votre couleur et logo
router.get('/receipts/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId)
      .populate('doctorId', 'fullName specialty')
      .populate('patientId', 'fullName email phoneNumber')
      .populate('appointmentId', 'startDateTime endDateTime');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Reçu non trouvé' });
    }

    if (
      (req.user.role === 'PATIENT' && payment.patientId._id.toString() !== req.user.userId) ||
      (req.user.role === 'DOCTOR' && payment.doctorId._id.toString() !== req.user.userId)
    ) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const PDFDocument = require('pdfkit');
    const fs = require('fs');
    const path = require('path');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${paymentId.slice(-8)}.pdf"`
    );

    doc.pipe(res);

    // ================== COULEURS ==================
    const primaryColor = '#2c3e50'; // bleu marine
    const secondaryColor = '#3498db';
    const successColor = '#27ae60';
    const warningColor = '#f39c12';
    const errorColor = '#e74c3c';
    const textSecondary = '#7f8c8d';
    const lightGray = '#ecf0f1';
    const borderColor = '#bdc3c7';

    const fontBold = 'Helvetica-Bold';
    const fontRegular = 'Helvetica';

    // ================== EN-TÊTE BLANC ==================
    doc.fillColor('white')
      .rect(0, 0, doc.page.width, 140)
      .fill();

    doc.strokeColor(primaryColor)
      .lineWidth(1)
      .moveTo(50, 140)
      .lineTo(doc.page.width - 50, 140)
      .stroke();

    // Logo
    const logoPath = path.join(__dirname, '../uploads/profiles/logonobg.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 35, { width: 100 });
    } else {
      doc.fillColor(primaryColor)
        .font(fontBold)
        .fontSize(32)
        .text('DOCTORY', 50, 45);
    }

    // Texte logo
    doc.fillColor(primaryColor)
      .fontSize(14)
      .font(fontRegular)
      .text('Système de Santé Digital', 210, 55);

    // Titre reçu
    doc.fillColor(primaryColor)
      .font(fontBold)
      .fontSize(14)
      .text('REÇU DE PAIEMENT', doc.page.width - 200, 45, {
        width: 150,
        align: 'right'
      });

    doc.font(fontRegular)
      .fontSize(14)
      .text(`N° ${paymentId.slice(-8)}`, doc.page.width - 200, 75, {
        width: 150,
        align: 'right'
      });

    doc.fillColor(textSecondary)
      .fontSize(11)
      .text(
        new Date(payment.createdAt).toLocaleDateString('fr-FR'),
        doc.page.width - 200,
        95,
        { width: 150, align: 'right' }
      );

    // ================== CONTENU ==================
    let y = 170;

    // Statut
    let statusColor = warningColor;
    let statusText = 'EN ATTENTE';
    if (payment.status === 'SUCCEEDED') {
      statusColor = successColor;
      statusText = 'PAYÉ';
    } else if (payment.status === 'FAILED') {
      statusColor = errorColor;
      statusText = 'ÉCHOUÉ';
    }

    doc.fillColor(statusColor)
      .roundedRect(doc.page.width - 170, y - 10, 120, 30, 5)
      .fill();

    doc.fillColor('white')
      .font(fontBold)
      .fontSize(12)
      .text(statusText, doc.page.width - 170, y, {
        width: 120,
        align: 'center'
      });

    // Infos principales
    doc.fillColor(primaryColor)
      .font(fontBold)
      .fontSize(13)
      .text('Informations principales', 50, y);

    y += 30;

    doc.fillColor(textSecondary)
      .font(fontRegular)
      .fontSize(11)
      .text('Méthode :', 50, y);

    const methodText =
      payment.paymentMethod === 'MOBILE_MONEY'
        ? 'Mobile Money'
        : payment.paymentMethod === 'CARD'
        ? 'Carte bancaire'
        : 'Virement bancaire';

    doc.fillColor(primaryColor)
      .font(fontBold)
      .text(methodText, 130, y);

    y += 30;

    // ================== PATIENT / MEDECIN ==================
    const colWidth = (doc.page.width - 100) / 2;

    doc.fillColor(lightGray)
      .roundedRect(50, y, colWidth - 10, 110, 6)
      .fill()
      .strokeColor(borderColor)
      .stroke();

    doc.fillColor(primaryColor)
      .font(fontBold)
      .fontSize(12)
      .text('PATIENT', 60, y + 15);

    doc.font(fontRegular)
      .fontSize(11)
      .text(payment.patientId.fullName, 60, y + 35);

    doc.fillColor(textSecondary)
      .fontSize(10)
      .text(`Email : ${payment.patientId.email}`, 60, y + 55)
      .text(`Tél : ${payment.patientId.phoneNumber}`, 60, y + 75);

    doc.fillColor(lightGray)
      .roundedRect(50 + colWidth, y, colWidth - 10, 110, 6)
      .fill()
      .stroke();

    doc.fillColor(primaryColor)
      .font(fontBold)
      .fontSize(12)
      .text('MÉDECIN', 60 + colWidth, y + 15);

    doc.font(fontRegular)
      .fontSize(11)
      .text(payment.doctorId.fullName, 60 + colWidth, y + 35);

    doc.fillColor(textSecondary)
      .fontSize(10)
      .text(`Spécialité : ${payment.doctorId.specialty}`, 60 + colWidth, y + 55);

    y += 150;

    // ================== TABLE PAIEMENT ==================
    doc.fillColor(primaryColor)
      .font(fontBold)
      .fontSize(14)
      .text('DÉTAILS DU PAIEMENT', 50, y);

    y += 30;

    const serviceFee = payment.amount * 0.07;
    const total = payment.amount + serviceFee;

    doc.font(fontRegular)
      .fontSize(11)
      .fillColor(primaryColor)
      .text('Consultation médicale', 60, y)
      .text(`${payment.amount.toFixed(2)} DT`, doc.page.width - 120, y, { align: 'right' });

    y += 25;

    doc.text('Frais de service (7%)', 60, y)
      .text(`${serviceFee.toFixed(2)} DT`, doc.page.width - 120, y, { align: 'right' });

    y += 20;

    doc.moveTo(50, y)
      .lineTo(doc.page.width - 50, y)
      .strokeColor(primaryColor)
      .stroke();

    y += 15;

    doc.font(fontBold)
      .fontSize(16)
      .text('TOTAL À PAYER', 60, y)
      .text(`${total.toFixed(2)} DT`, doc.page.width - 120, y, { align: 'right' });

    // ================== FOOTER ==================
    const footerY = doc.page.height - 90;

    doc.strokeColor(borderColor)
      .moveTo(50, footerY)
      .lineTo(doc.page.width - 50, footerY)
      .stroke();

    doc.fillColor(primaryColor)
      .font(fontBold)
      .fontSize(12)
      .text('Merci pour votre confiance !', 50, footerY + 15, {
        width: doc.page.width - 100,
        align: 'center'
      });

    doc.fillColor(textSecondary)
      .font(fontRegular)
      .fontSize(9)
      .text('Ce document constitue un reçu officiel de paiement.', 50, footerY + 35, {
        width: doc.page.width - 100,
        align: 'center'
      });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur PDF' });
  }
});



router.get("/wallet/balance", authMiddleware, WalletController.getWalletBalance);
router.get("/wallet/transactions", authMiddleware, WalletController.getTransactions);
router.get("/wallet/transactions/:type", authMiddleware, WalletController.getTransactions);
router.post("/wallet/withdraw", authMiddleware, WalletController.requestWithdrawal);
router.get("/wallet/withdrawals", authMiddleware, WalletController.getWithdrawals);
router.get("/receipts", authMiddleware, WalletController.getPaymentReceipts);
router.get("/receipt/:paymentId", authMiddleware, WalletController.getReceiptById);
router.post("/wallet/update-bank", authMiddleware, WalletController.updateBankAccount);

module.exports = router;