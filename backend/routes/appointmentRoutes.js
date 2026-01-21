const express = require("express");
const router = express.Router();
const AppointmentController = require("../controllers/AppointmentController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const Appointment = require("../models/Appointment");

console.log("Appointment routes loaded");

// Middleware de logging
router.use((req, res, next) => {
  console.log(`[AppointmentRoutes] ${req.method} ${req.path}`);
  next();
});

// All appointment routes require authentication
router.use(authMiddleware);

// Middleware pour vérifier que l'authentification a réussi
router.use((req, res, next) => {
  console.log(`[AppointmentRoutes] Authenticated user:`, req.user);
  if (!req.user) {
    console.log(`[AppointmentRoutes] No user found after auth middleware`);
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
  next();
});

// Route test
router.get("/test", (req, res) => {
  console.log(`[AppointmentRoutes] GET /test called`);
  res.json({
    success: true,
    message: "Appointment routes are working!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Create appointment (Patient only)
router.post("/", (req, res) => {
  console.log(`[AppointmentRoutes] POST / called`);
  console.log(`[AppointmentRoutes] Request body:`, req.body);
  AppointmentController.createAppointment(req, res);
});

// Get user's appointments (filtered by role)
router.get("/", (req, res) => {
  console.log(`[AppointmentRoutes] GET / called`);
  AppointmentController.getAppointments(req, res);
});

// Get upcoming appointments
router.get("/upcoming", (req, res) => {
  console.log(`[AppointmentRoutes] GET /upcoming called`);
  AppointmentController.getUpcomingAppointments(req, res);
});

// Get specific appointment by ID
router.get("/:id", (req, res) => {
  console.log(`[AppointmentRoutes] GET /${req.params.id} called`);
  AppointmentController.getAppointmentById(req, res);
});

// Confirm appointment (Doctor only)
router.post("/:id/confirm", (req, res) => {
  console.log(`[AppointmentRoutes] POST /${req.params.id}/confirm called`);
  AppointmentController.confirmAppointment(req, res);
});

// Cancel appointment (Doctor, Patient, or Admin)
router.post("/:id/cancel", (req, res) => {
  console.log(`[AppointmentRoutes] POST /${req.params.id}/cancel called`);
  AppointmentController.cancelAppointment(req, res);
});

// Complete appointment (Doctor or Admin)
router.post("/:id/complete", (req, res) => {
  console.log(`[AppointmentRoutes] POST /${req.params.id}/complete called`);
  AppointmentController.completeAppointment(req, res);
});
// Dans AppointmentRoutes.js
router.get("/room/:roomId", async (req, res) => {
  try {
    console.log(`[AppointmentRoutes] Checking access to room: ${req.params.roomId}`);
    console.log(`[AppointmentRoutes] User ID from token: ${req.user.userId}`);

    const appointment = await Appointment.findOne({
      videoRoomId: req.params.roomId,
    }).populate('doctorId').populate('patientId');

    if (!appointment) {
      console.log(`[AppointmentRoutes] No appointment found for roomId ${req.params.roomId}`);
      return res.status(404).json({ 
        message: "Salle de consultation introuvable" 
      });
    }

    const userId = req.user.userId;
    
    console.log(`[AppointmentRoutes] Doctor ID: ${appointment.doctorId._id}`);
    console.log(`[AppointmentRoutes] Patient ID: ${appointment.patientId._id}`);
    console.log(`[AppointmentRoutes] Current User ID: ${userId}`);

    // Vérifier l'accès en comparant les IDs en string
    if (
      appointment.doctorId._id.toString() !== userId.toString() &&
      appointment.patientId._id.toString() !== userId.toString()
    ) {
      console.log(`[AppointmentRoutes] Access denied for user ${userId}`);
      return res.status(403).json({ 
        message: "Accès refusé. Vous n'êtes pas autorisé à accéder à cette consultation." 
      });
    }

    // Vérifier aussi le statut du rendez-vous
    if (appointment.status !== "CONFIRMED" && appointment.status !== "COMPLETED") {
      return res.status(403).json({
        message: `La consultation n'est pas disponible (statut: ${appointment.status})`
      });
    }

    // Vérifier l'horaire
    const now = new Date();
    const appointmentTime = new Date(appointment.startDateTime);
    const timeDiff = appointmentTime - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // Permettre l'accès 15 minutes avant et après
    if (hoursDiff < -0.25 || hoursDiff > 2) {
      return res.status(403).json({
        message: "La consultation n'est pas disponible en dehors des horaires prévus"
      });
    }

    console.log(`[AppointmentRoutes] Access granted to room ${req.params.roomId}`);
    res.json({ 
      allowed: true, 
      appointment,
      message: "Accès autorisé"
    });

  } catch (err) {
    console.error(`[AppointmentRoutes] Error in /room/:roomId`, err);
    res.status(500).json({ 
      message: "Erreur serveur lors de la vérification d'accès" 
    });
  }
});

module.exports = router;