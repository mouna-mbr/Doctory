const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentController");
const { authMiddleware } = require("../middlewares/authMiddleware");

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

module.exports = router;