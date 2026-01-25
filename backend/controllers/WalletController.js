// controllers/WalletController.js (NOUVEAU)
const User = require("../models/User");
const Payment = require("../models/Payment");
const Appointment = require("../models/Appointment");
const Withdrawal = require("../models/Withdrawal");

class WalletController {
  // 1. GET /api/payments/wallet/balance
  async getWalletBalance(req, res) {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId).select("walletBalance totalEarned pendingBalance lastWithdrawal role fullName");
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "Utilisateur non trouvé" 
        });
      }
      
      // Pour les médecins: calculer les revenus en attente
      if (user.role === "DOCTOR") {
        const pendingAppointments = await Appointment.find({
          doctorId: userId,
          paymentStatus: "PAID",
          status: { $in: ["CONFIRMED", "COMPLETED"] }
        });
        
        const pendingAmount = pendingAppointments.reduce((sum, apt) => sum + (apt.amount || 0), 0);
        
        // Mettre à jour le solde en attente
        user.pendingBalance = pendingAmount;
        await user.save();
      }
      
      res.json({
        success: true,
        data: {
          balance: user.walletBalance,
          pendingBalance: user.pendingBalance,
          totalEarned: user.totalEarned,
          currency: "DT",
          canWithdraw: user.walletBalance >= 100,
          lastWithdrawal: user.lastWithdrawal,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  // 2. GET /api/payments/wallet/transactions
  async getTransactions(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, type } = req.query;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "Utilisateur non trouvé" 
        });
      }
      
      let query = {};
      
      // Selon le rôle
      if (user.role === "PATIENT") {
        query = { patientId: userId };
      } else if (user.role === "DOCTOR") {
        query = { doctorId: userId };
      } else {
        query = { 
          $or: [{ patientId: userId }, { doctorId: userId }] 
        };
      }
      
      // Filtrer par type si spécifié
      if (type === "income") {
        query.status = "SUCCEEDED";
      } else if (type === "withdrawal") {
        // Pour les retraits (médecins seulement)
        if (user.role === "DOCTOR") {
          const withdrawals = await Withdrawal.find({ doctorId: userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
          
          return res.json({
            success: true,
            data: {
              transactions: withdrawals.map(w => ({
                type: "WITHDRAWAL",
                id: w._id,
                date: w.createdAt,
                amount: -w.amount,
                status: w.status,
                description: `Retrait ${w.method}`,
                method: w.method,
                netAmount: w.netAmount,
                fees: w.fees
              })),
              total: await Withdrawal.countDocuments({ doctorId: userId }),
              page: parseInt(page),
              pages: Math.ceil(await Withdrawal.countDocuments({ doctorId: userId }) / limit)
            }
          });
        }
      }
      
      // Paiements normaux
      const payments = await Payment.find(query)
        .populate("patientId", "fullName")
        .populate("doctorId", "fullName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      
      const transactions = payments.map(p => ({
        type: "PAYMENT",
        id: p._id,
        date: p.createdAt,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        description: `Consultation #${p.appointmentId ? p.appointmentId.toString().slice(-6) : ''}`,
        counterpart: user.role === "PATIENT" 
          ? { name: p.doctorId?.fullName, role: "Médecin" }
          : { name: p.patientId?.fullName, role: "Patient" },
        appointmentId: p.appointmentId
      }));
      
      res.json({
        success: true,
        data: {
          transactions,
          total: await Payment.countDocuments(query),
          page: parseInt(page),
          pages: Math.ceil(await Payment.countDocuments(query) / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  // 3. POST /api/payments/wallet/withdraw
  async requestWithdrawal(req, res) {
    try {
      const userId = req.user.userId;
      const { amount, method, destination } = req.body;
      
      const user = await User.findById(userId);
      
      if (user.role !== "DOCTOR") {
        return res.status(403).json({ 
          success: false, 
          message: "Réservé aux médecins" 
        });
      }
      
      // Vérifications
      if (user.walletBalance < amount) {
        return res.status(400).json({ 
          success: false, 
          message: "Solde insuffisant" 
        });
      }
      
      if (amount < 100) {
        return res.status(400).json({ 
          success: false, 
          message: "Le minimum de retrait est de 100 DT" 
        });
      }
      
      // Calculer les frais (5% ou 10 DT minimum)
      const fees = Math.max(amount * 0.05, 10);
      const netAmount = amount - fees;
      
      // Créer le retrait
      const withdrawal = new Withdrawal({
        doctorId: userId,
        amount,
        method,
        destination,
        fees,
        netAmount,
        status: "PENDING"
      });
      
      await withdrawal.save();
      
      // Mettre à jour le solde utilisateur
      user.walletBalance -= amount;
      user.lastWithdrawal = new Date();
      await user.save();
      
      res.json({
        success: true,
        message: "Demande de retrait envoyée",
        data: {
          withdrawalId: withdrawal._id,
          amount,
          fees,
          netAmount,
          estimatedArrival: "3-5 jours ouvrables",
          newBalance: user.walletBalance
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  // 4. GET /api/payments/wallet/withdrawals
  async getWithdrawals(req, res) {
    try {
      const userId = req.user.userId;
      const { status } = req.query;
      
      const user = await User.findById(userId);
      if (user.role !== "DOCTOR") {
        return res.status(403).json({ 
          success: false, 
          message: "Réservé aux médecins" 
        });
      }
      
      let query = { doctorId: userId };
      if (status) query.status = status;
      
      const withdrawals = await Withdrawal.find(query)
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: withdrawals
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  // 5. GET /api/payments/receipts
  async getPaymentReceipts(req, res) {
    try {
      const userId = req.user.userId;
      const { status } = req.query;
      
      const user = await User.findById(userId);
      let query = {};
      
      if (user.role === "PATIENT") {
        query = { patientId: userId };
      } else if (user.role === "DOCTOR") {
        query = { doctorId: userId };
      } else {
        return res.status(403).json({ 
          success: false, 
          message: "Non autorisé" 
        });
      }
      
      if (status && status !== "all") {
        query.status = status;
      }
      
      const payments = await Payment.find(query)
        .populate("doctorId", "fullName specialty")
        .populate("patientId", "fullName")
        .populate("appointmentId", "startDateTime endDateTime reason")
        .sort({ createdAt: -1 });
      
      const receipts = payments.map(payment => ({
        id: payment._id,
        date: payment.createdAt,
        doctorName: payment.doctorId?.fullName || "Médecin",
        patientName: payment.patientId?.fullName || "Patient",
        specialty: payment.doctorId?.specialty || "Non spécifié",
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.paymentMethod,
        appointmentDate: payment.appointmentId?.startDateTime,
        reason: payment.appointmentId?.reason,
        receiptUrl: payment.receiptUrl,
        transactionId: payment.gatewayTransactionId,
        appointmentId: payment.appointmentId
      }));
      
      res.json({ 
        success: true, 
        data: receipts 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  // 6. GET /api/payments/receipt/:paymentId
  async getReceiptById(req, res) {
    try {
      const userId = req.user.userId;
      const { paymentId } = req.params;
      
      const payment = await Payment.findById(paymentId)
        .populate("doctorId", "fullName specialty")
        .populate("patientId", "fullName email")
        .populate("appointmentId", "startDateTime endDateTime reason");
      
      if (!payment) {
        return res.status(404).json({ 
          success: false, 
          message: "Reçu non trouvé" 
        });
      }
      
      // Vérifier l'accès
      const isPatient = payment.patientId._id.toString() === userId;
      const isDoctor = payment.doctorId._id.toString() === userId;
      
      if (!isPatient && !isDoctor) {
        return res.status(403).json({ 
          success: false, 
          message: "Non autorisé" 
        });
      }
      
      res.json({
        success: true,
        data: {
          id: payment._id,
          date: payment.createdAt,
          doctorName: payment.doctorId.fullName,
          patientName: payment.patientId.fullName,
          patientEmail: payment.patientId.email,
          specialty: payment.doctorId.specialty,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.paymentMethod,
          appointmentDate: payment.appointmentId?.startDateTime,
          appointmentEnd: payment.appointmentId?.endDateTime,
          reason: payment.appointmentId?.reason,
          receiptUrl: payment.receiptUrl,
          transactionId: payment.gatewayTransactionId,
          notes: payment.appointmentId?.notes
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  // 7. POST /api/payments/wallet/update-bank (optionnel)
  async updateBankAccount(req, res) {
    try {
      const userId = req.user.userId;
      const { bankAccount } = req.body;
      
      const user = await User.findById(userId);
      if (user.role !== "DOCTOR") {
        return res.status(403).json({ 
          success: false, 
          message: "Réservé aux médecins" 
        });
      }
      
      user.bankAccount = bankAccount;
      await user.save();
      
      res.json({
        success: true,
        message: "Compte bancaire mis à jour",
        data: user.bankAccount
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

module.exports = new WalletController();