const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const NotificationService = require('./NotificationService');

class PaymentService {
  constructor() {
    this.stripe = stripe;
  }

  // Créer une session de paiement Stripe
    async createStripeSession(appointmentId, patientId) {
    try {
        // Vérifier le rendez-vous et le patient
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
        throw new Error("Rendez-vous non trouvé");
        }
        
        // Vérifier que le patient est bien celui du rendez-vous
        if (appointment.patientId.toString() !== patientId) {
        throw new Error("Non autorisé à payer ce rendez-vous");
        }
        
        // Vérifier le statut du rendez-vous
        if (appointment.status !== "CONFIRMED") {
        throw new Error("Le rendez-vous doit être confirmé pour effectuer le paiement");
        }
        
        // Vérifier si le paiement n'a pas déjà été effectué
        const existingPayment = await Payment.findOne({ appointmentId });
        if (existingPayment && existingPayment.status === "SUCCEEDED") {
        throw new Error("Le paiement a déjà été effectué");
        }

        // Configuration des options de session Stripe
        const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
            price_data: {
                currency: 'usd',
                product_data: {
                name: `Consultation avec Dr. ${appointment.doctorId.name}`,
                description: `Rendez-vous du ${new Date(appointment.startDateTime).toLocaleDateString()} à ${new Date(appointment.startDateTime).toLocaleTimeString()}`,
                },
                unit_amount: Math.round(appointment.amount * 100), // Convertir en cents
            },
            quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
            appointmentId: appointmentId,
            patientId: patientId,
            doctorId: appointment.doctorId._id.toString(),
        },
        customer_email: appointment.patientId.email,
        client_reference_id: appointmentId,
        });

        // Créer ou mettre à jour l'enregistrement de paiement
        const paymentData = {
        appointmentId: appointment._id,
        patientId: appointment.patientId._id,
        doctorId: appointment.doctorId._id,
        amount: appointment.amount,
        currency: "DT",
        status: "PENDING",
        paymentMethod: "CARD",
        paymentGateway: "STRIPE",
        gatewayTransactionId: session.id,
        metadata: {
            checkoutSessionId: session.id,
            checkoutSessionUrl: session.url,
            paymentIntent: session.payment_intent,
        },
        };

        await Payment.findOneAndUpdate(
        { appointmentId: appointment._id },
        paymentData,
        { upsert: true, new: true }
        );

        return {
        sessionId: session.id,
        sessionUrl: session.url, // Retourner l'URL de checkout
        amount: appointment.amount,
        currency: "DT",
        };
        
    } catch (error) {
        console.error("Error creating Stripe session:", error);
        throw error;
    }
    }

  // Vérifier le statut d'une session Stripe
    async verifyStripePayment(sessionId) {
    try {
        const session = await this.stripe.checkout.sessions.retrieve(sessionId);
        
        if (!session) {
        throw new Error('Session non trouvée');
        }

        const appointmentId = session.metadata.appointmentId;
        const appointment = await Appointment.findById(appointmentId)
         .populate('doctorId', 'fullName consultationPrice')  // <-- Ici on récupère fullName
         .populate('patientId', 'fullName email phoneNumber');
        const doctor = appointment.doctorId;
        const patient = appointment.patientId;

        if (!appointment) {
        throw new Error('Rendez-vous non trouvé');
        }

        if (session.payment_status === 'paid') {
        // ✅ CORRECTION : TOUJOURS créer une salle si elle n'existe pas
        if (!appointment.videoRoomId) {
            // Générer un ID de salle sécurisé et unique
            const videoRoomId = `room_${appointment._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;
            appointment.videoRoomId = videoRoomId;
            console.log("✅ Created videoRoomId after payment:", videoRoomId);
        }
        
        // Mettre à jour le statut de paiement du rendez-vous
        appointment.paymentStatus = 'PAID';
        appointment.paymentDate = new Date();
        appointment.paymentMethod = 'CARD';
        appointment.paymentId = session.payment_intent;
        
        // S'assurer que le statut est bien CONFIRMED
        if (appointment.status !== 'CONFIRMED') {
            appointment.status = 'CONFIRMED';
        }
        
        await appointment.save();
        
          // ✅ AJOUTER: Mettre à jour le portefeuille du médecin
        try {
          const doctor = await User.findById(appointment.doctorId._id);
          if (doctor && doctor.role === "DOCTOR") {
            // Ajouter 85% au médecin (15% de commission)
            const doctorShare = payment.amount * 0.85;
            doctor.walletBalance += doctorShare;
            doctor.totalEarned += doctorShare;
            await doctor.save();
            
            console.log(`💰 Médecin ${doctor.fullName} a reçu ${doctorShare} DT`);
          }
        } catch (walletError) {
          console.error("Erreur mise à jour portefeuille:", walletError);
          // Ne pas bloquer le paiement pour une erreur de portefeuille
        }
        // Créer un enregistrement de paiement
        const payment = new Payment({
            appointmentId: appointment._id,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            amount: session.amount_total / 100, // Convertir en dollars
            currency: session.currency,
            status: 'SUCCEEDED',
            paymentMethod: 'CARD',
            paymentGateway: 'STRIPE',
            gatewayTransactionId: session.payment_intent,
            receiptUrl: session.charges?.data?.[0]?.receipt_url,
            // ✅ Stocker aussi l'ID de la salle dans le paiement
            metadata: {
            videoRoomId: appointment.videoRoomId,
            checkoutSessionId: session.id
            }
        });
        await payment.save();

        // Envoyer une notification au patient
        await NotificationService.createPaymentSuccessNotification(
            appointment.patientId,
            doctor.fullName,
            payment.amount,
            appointmentId
        );

        // Envoyer une notification au docteur
        await NotificationService.createPaymentReceivedNotification(
            appointment.doctorId,
            patient.fullName,
            payment.amount,
            appointmentId
        );

        return {
            success: true,
            paymentStatus: 'PAID',
            appointment,
            payment,
            videoRoomId: appointment.videoRoomId // ✅ Retourner l'ID de salle
        };
        }

        return {
        success: false,
        paymentStatus: session.payment_status,
        };
    } catch (error) {
        console.error('Erreur lors de la vérification du paiement:', error);
        throw error;
    }
    }
  // Créer un lien de paiement pour mobile money (simulation)
  async createMobileMoneyPayment(appointmentId, patientId, provider) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'fullName consultationPrice')
        .populate('patientId', 'fullName phoneNumber');
      
      if (!appointment) {
        throw new Error('Rendez-vous non trouvé');
      }

      if (appointment.patientId._id.toString() !== patientId.toString()) {
        throw new Error('Non autorisé');
      }

      if (appointment.status !== 'CONFIRMED') {
        throw new Error('Le rendez-vous doit être confirmé pour effectuer le paiement');
      }

      if (appointment.paymentStatus === 'PAID') {
        throw new Error('Le paiement a déjà été effectué');
      }

      const doctor = await User.findById(appointment.doctorId);
      const amount = doctor.consultationPrice;

      if (!amount || amount <= 0) {
        throw new Error('Le prix de consultation du docteur n\'est pas défini');
      }

      // Simuler la création d'un paiement mobile money
      // Dans un cas réel, vous intégreriez une API comme Flutterwave, Paystack, etc.
      const paymentId = `MM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Mettre à jour le rendez-vous
      appointment.paymentStatus = 'PENDING';
      appointment.paymentMethod = 'MOBILE_MONEY';
      await appointment.save();

      // Créer un enregistrement de paiement
      const payment = new Payment({
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        amount: amount,
        currency: 'USD',
        status: 'PENDING',
        paymentMethod: 'MOBILE_MONEY',
        paymentGateway: provider === 'orange' ? 'ORANGE_MONEY' : 'MTN_MOBILE_MONEY',
        metadata: {
          provider,
          phoneNumber: appointment.patientId.phoneNumber,
          paymentId,
        },
      });
      await payment.save();

      // Simuler l'envoi d'une demande de paiement
      const paymentRequest = {
        success: true,
        paymentId,
        amount,
        currency: 'USD',
        phoneNumber: appointment.patientId.phoneNumber,
        provider,
        instructions: `Veuillez effectuer un paiement de ${amount} USD via ${provider === 'orange' ? 'Orange Money' : 'MTN Mobile Money'} au numéro ${process.env.MOBILE_MONEY_NUMBER}`,
        verificationUrl: `${process.env.FRONTEND_URL}/payment/verify/${paymentId}`,
      };

      return paymentRequest;
    } catch (error) {
      console.error('Erreur lors de la création du paiement mobile money:', error);
      throw error;
    }
  }

  // Vérifier le statut d'un paiement
  async getPaymentStatus(appointmentId, userId) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctorId', 'fullName')
        .populate('patientId', 'fullName');
      
      if (!appointment) {
        throw new Error('Rendez-vous non trouvé');
      }

      // Vérifier les permissions
      const isPatient = appointment.patientId._id.toString() === userId.toString();
      const isDoctor = appointment.doctorId._id.toString() === userId.toString();
      
      if (!isPatient && !isDoctor) {
        throw new Error('Non autorisé');
      }

      const payment = await Payment.findOne({ appointmentId });

      return {
        appointment,
        payment,
        canAccessVideo: appointment.canAccessVideo,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de paiement:', error);
      throw error;
    }
  }

  // Rembourser un paiement (pour les annulations)
  async refundPayment(appointmentId, userId, userRole) {
    try {
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        throw new Error('Rendez-vous non trouvé');
      }

      if (appointment.paymentStatus !== 'PAID') {
        throw new Error('Aucun paiement à rembourser');
      }

      // Seul le docteur ou l'admin peut initier un remboursement
      const isDoctor = appointment.doctorId.toString() === userId.toString();
      const isAdmin = userRole === 'ADMIN';
      
      if (!isDoctor && !isAdmin) {
        throw new Error('Non autorisé');
      }

      // Remboursement Stripe
      if (appointment.paymentMethod === 'CARD' && appointment.paymentId) {
        const refund = await this.stripe.refunds.create({
          payment_intent: appointment.paymentId,
        });

        // Mettre à jour le statut
        appointment.paymentStatus = 'REFUNDED';
        await appointment.save();

        // Mettre à jour l'enregistrement de paiement
        await Payment.findOneAndUpdate(
          { appointmentId },
          { status: 'REFUNDED', metadata: { ...refund } }
        );

        return {
          success: true,
          refund,
          message: 'Remboursement effectué avec succès',
        };
      }

      // Pour les autres méthodes de paiement, marquer comme remboursé manuellement
      appointment.paymentStatus = 'REFUNDED';
      await appointment.save();

      await Payment.findOneAndUpdate(
        { appointmentId },
        { status: 'REFUNDED' }
      );

      return {
        success: true,
        message: 'Paiement marqué comme remboursé',
      };
    } catch (error) {
      console.error('Erreur lors du remboursement:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();