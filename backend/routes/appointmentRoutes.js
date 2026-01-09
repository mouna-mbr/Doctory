const express = require("express");
const router = express.Router();
const AppointmentController = require("../controllers/AppointmentController");
const { authMiddleware } = require("../middlewares/authMiddleware");

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

module.exports = router;