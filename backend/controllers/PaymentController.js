const PaymentService = require("../services/PaymentService");
const AppointmentService = require("../services/AppointmentService");

class PaymentController {


  // Vérifier le statut d'un paiement Stripe
  async verifyStripePayment(req, res) {
    try {
      const { sessionId } = req.body;

      const result = await PaymentService.verifyStripePayment(sessionId);

      res.status(200).json({
        success: result.success,
        message: result.success ? "Paiement vérifié avec succès" : "Paiement non effectué",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Créer un paiement mobile money
  async createMobileMoneyPayment(req, res) {
    try {
      const { appointmentId } = req.params;
      const { provider } = req.body; // 'orange' ou 'mtn'
      const patientId = req.user.userId;

      const result = await PaymentService.createMobileMoneyPayment(appointmentId, patientId, provider);

      res.status(200).json({
        success: true,
        message: "Demande de paiement mobile money créée",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Vérifier le statut d'un paiement
  async getPaymentStatus(req, res) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.userId;

      const result = await PaymentService.getPaymentStatus(appointmentId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Effectuer un remboursement
  async refundPayment(req, res) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      const result = await PaymentService.refundPayment(appointmentId, userId, userRole);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Webhook Stripe pour les événements de paiement
  async stripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Erreur de signature webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer les événements
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await PaymentService.verifyStripePayment(session.id);
        break;
      case 'payment_intent.succeeded':
        console.log('Paiement réussi via webhook');
        break;
      case 'payment_intent.payment_failed':
        console.log('Paiement échoué via webhook');
        break;
      default:
        console.log(`Événement non géré: ${event.type}`);
    }

    res.json({ received: true });
  }
  // Dans PaymentController.js
    async createStripeSession(req, res) {
    try {
        const { appointmentId } = req.params;
        const patientId = req.user.userId;

        const result = await PaymentService.createStripeSession(appointmentId, patientId);

        res.status(200).json({
        success: true,
        message: "Session de paiement créée avec succès",
        data: {
            sessionId: result.sessionId,
            sessionUrl: result.sessionUrl, // Ajoutez ceci
            amount: result.amount,
            currency: result.currency
        },
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: error.message,
        });
    }
    }
}

module.exports = new PaymentController();