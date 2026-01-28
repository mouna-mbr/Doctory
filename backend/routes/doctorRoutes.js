// routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const MedicalExam = require("../models/MedicalExam");
const User = require("../models/User");

// Récupérer les statistiques du médecin
router.get("/:doctorId/stats", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Vérifier que le médecin accède à ses propres stats
    if (req.user.role !== "ADMIN" && req.user.userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // Statistiques des rendez-vous
    const totalAppointments = await Appointment.countDocuments({ doctorId });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointments = await Appointment.countDocuments({
      doctorId,
      startDateTime: { $gte: today, $lt: tomorrow },
      status: { $in: ["CONFIRMED", "COMPLETED"] }
    });

    const pendingAppointments = await Appointment.countDocuments({
      doctorId,
      status: "REQUESTED"
    });

    const completedAppointments = await Appointment.countDocuments({
      doctorId,
      status: "COMPLETED"
    });

    // Statistiques des patients
    const uniquePatients = await Appointment.distinct("patientId", { doctorId });
    const totalPatients = uniquePatients.length;

    // Patients du mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newPatientsThisMonth = await Appointment.distinct("patientId", {
      doctorId,
      createdAt: { $gte: startOfMonth }
    });

    const newPatients = newPatientsThisMonth.length;

    // Revenu mensuel
    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);
    
    const revenueAppointments = await Appointment.find({
      doctorId,
      paymentStatus: "PAID",
      paymentDate: { $gte: startOfCurrentMonth }
    });

    const monthlyRevenue = revenueAppointments.reduce((total, appointment) => {
      return total + (appointment.amount || 0);
    }, 0);

    // Ordonnances en attente
    const pendingPrescriptions = await Prescription.countDocuments({
      doctorId,
      status: "DRAFT"
    });

    // Examens en attente
    const pendingExams = await MedicalExam.countDocuments({
      doctorId,
      status: "RESULTS_UPLOADED"
    });

    // Messages non lus (exemple)
    const unreadMessages = 5; // À implémenter avec un système de messagerie

    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        totalPatients,
        newPatients,
        monthlyRevenue,
        pendingPrescriptions,
        pendingExams,
        unreadMessages
      }
    });
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// Récupérer les ordonnances du médecin
router.get("/:doctorId/prescriptions", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status } = req.query;

    // Vérifier les permissions
    if (req.user.role !== "ADMIN" && req.user.userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const query = { doctorId };
    if (status) {
      query.status = status;
    }

    const prescriptions = await Prescription.find(query)
      .populate("patientId", "fullName profileImage dateOfBirth gender")
      .populate("appointmentId", "startDateTime reason")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Error fetching doctor prescriptions:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// Récupérer les examens du médecin
router.get("/:doctorId/exams", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status } = req.query;

    // Vérifier les permissions
    if (req.user.role !== "ADMIN" && req.user.userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const query = { doctorId };
    if (status) {
      query.status = status;
    }

    const exams = await MedicalExam.find(query)
      .populate("patientId", "fullName profileImage")
      .populate("appointmentId", "startDateTime")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error("Error fetching doctor exams:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// Récupérer les patients du médecin
router.get("/:doctorId/patients", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Vérifier les permissions
    if (req.user.role !== "ADMIN" && req.user.userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // Récupérer les patients distincts avec leurs dernières consultations
    const patientIds = await Appointment.distinct("patientId", { doctorId });

    const patients = await User.find({
      _id: { $in: patientIds },
      role: "PATIENT"
    })
    .select("fullName email phoneNumber dateOfBirth gender profileImage createdAt")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

    // Pour chaque patient, récupérer le dernier rendez-vous
    const patientsWithDetails = await Promise.all(
      patients.map(async (patient) => {
        const lastAppointment = await Appointment.findOne({
          doctorId,
          patientId: patient._id
        })
        .sort({ startDateTime: -1 })
        .select("startDateTime status");

        return {
          ...patient.toObject(),
          lastAppointment
        };
      })
    );

    res.status(200).json({
      success: true,
      data: patientsWithDetails,
      total: patientIds.length,
    });
  } catch (error) {
    console.error("Error fetching doctor patients:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// Mettre à jour le profil médecin
router.put("/:doctorId/profile", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const updateData = req.body;

    // Vérifier que le médecin met à jour son propre profil
    if (req.user.role !== "ADMIN" && req.user.userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez modifier que votre propre profil",
      });
    }

    // Champs autorisés pour la mise à jour
    const allowedUpdates = [
      "fullName",
      "phoneNumber",
      "profileImage",
      "specialty",
      "yearsOfExperience",
      "consultationPrice",
      "bankAccount"
    ];

    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    const doctor = await User.findByIdAndUpdate(
      doctorId,
      updates,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Médecin non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: doctor,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Récupérer le portefeuille du médecin
router.get("/:doctorId/wallet", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Vérifier les permissions
    if (req.user.role !== "ADMIN" && req.user.userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const doctor = await User.findById(doctorId).select("walletBalance totalEarned pendingBalance lastWithdrawal");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Médecin non trouvé",
      });
    }

    // Récupérer les transactions récentes
    const recentPayments = await Appointment.find({
      doctorId,
      paymentStatus: "PAID",
      paymentDate: { $ne: null }
    })
    .select("patientId amount paymentDate paymentMethod")
    .populate("patientId", "fullName")
    .sort({ paymentDate: -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      data: {
        balance: doctor.walletBalance,
        totalEarned: doctor.totalEarned,
        pendingBalance: doctor.pendingBalance,
        lastWithdrawal: doctor.lastWithdrawal,
        recentTransactions: recentPayments
      }
    });
  } catch (error) {
    console.error("Error fetching doctor wallet:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// Demander un retrait
router.post("/:doctorId/withdraw", authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { amount } = req.body;

    // Vérifier les permissions
    if (req.user.role !== "ADMIN" && req.user.userId !== doctorId) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    const doctor = await User.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Médecin non trouvé",
      });
    }

    // Vérifier le solde disponible
    if (amount > doctor.walletBalance) {
      return res.status(400).json({
        success: false,
        message: "Solde insuffisant",
      });
    }

    // Vérifier que le compte bancaire est configuré
    if (!doctor.bankAccount || !doctor.bankAccount.verified) {
      return res.status(400).json({
        success: false,
        message: "Veuillez configurer et vérifier votre compte bancaire",
      });
    }

    // Mettre à jour le solde
    doctor.walletBalance -= amount;
    doctor.lastWithdrawal = new Date();
    await doctor.save();

    // Ici, tu devrais créer une transaction de retrait dans ta base de données
    // et potentiellement envoyer une notification à l'administrateur

    res.status(200).json({
      success: true,
      message: "Demande de retrait envoyée avec succès",
      data: {
        newBalance: doctor.walletBalance,
        amountWithdrawn: amount,
        withdrawalDate: doctor.lastWithdrawal
      }
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

module.exports = router;