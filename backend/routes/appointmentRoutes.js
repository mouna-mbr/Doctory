const express = require("express");
const router = express.Router();
const AppointmentController = require("../controllers/AppointmentController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// All appointment routes require authentication
router.use(authMiddleware);

// Create appointment (Patient only)
router.post("/", (req, res) => AppointmentController.createAppointment(req, res));

// Get user's appointments (filtered by role)
router.get("/", (req, res) => AppointmentController.getAppointments(req, res));

// Get upcoming appointments
router.get("/upcoming", (req, res) => AppointmentController.getUpcomingAppointments(req, res));

// Get specific appointment by ID
router.get("/:id", (req, res) => AppointmentController.getAppointmentById(req, res));

// Confirm appointment (Doctor only)
router.post("/:id/confirm", (req, res) => AppointmentController.confirmAppointment(req, res));

// Cancel appointment (Doctor, Patient, or Admin)
router.post("/:id/cancel", (req, res) => AppointmentController.cancelAppointment(req, res));

// Complete appointment (Doctor or Admin)
router.post("/:id/complete", (req, res) => AppointmentController.completeAppointment(req, res));

module.exports = router;
