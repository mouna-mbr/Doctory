const express = require("express");
const router = express.Router();
const AvailabilityController = require("../controllers/AvailabilityController");
const { authMiddleware } = require("../middlewares/authMiddleware");

console.log("Availability routes loaded");

// Middleware de logging
router.use((req, res, next) => {
  console.log(`[AvailabilityRoutes] ${req.method} ${req.path}`);
  next();
});

// All availability routes require authentication
router.use(authMiddleware);

// Middleware pour vérifier que l'authentification a réussi
router.use((req, res, next) => {
  console.log(`[AvailabilityRoutes] Authenticated user:`, req.user);
  if (!req.user) {
    console.log(`[AvailabilityRoutes] No user found after auth middleware`);
    return res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
  next();
});

// Route test
router.get("/test", (req, res) => {
  console.log(`[AvailabilityRoutes] GET /test called`);
  res.json({
    success: true,
    message: "Availability routes are working!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Create availability slot (Doctor only)
router.post("/", (req, res) => {
  console.log(`[AvailabilityRoutes] POST / called`);
  console.log(`[AvailabilityRoutes] Request body:`, req.body);
  AvailabilityController.createAvailability(req, res);
});

// Get own availability (Doctor only)
router.get("/my", (req, res) => {
  console.log(`[AvailabilityRoutes] GET /my called`);
  AvailabilityController.getMyAvailability(req, res);
});

// Get doctor's availability (public for authenticated users)
router.get("/doctor/:doctorId", (req, res) => {
  console.log(`[AvailabilityRoutes] GET /doctor/${req.params.doctorId} called`);
  AvailabilityController.getDoctorAvailability(req, res);
});

// Get available time slots for booking (public for authenticated users)
router.get("/doctor/:doctorId/slots", (req, res) => {
  console.log(`[AvailabilityRoutes] GET /doctor/${req.params.doctorId}/slots called`);
  AvailabilityController.getAvailableSlots(req, res);
});

// Update availability slot (Doctor only)
router.put("/:id", (req, res) => {
  console.log(`[AvailabilityRoutes] PUT /${req.params.id} called`);
  AvailabilityController.updateAvailability(req, res);
});

// Delete availability slot (Doctor only)
router.delete("/:id", (req, res) => {
  console.log(`[AvailabilityRoutes] DELETE /${req.params.id} called`);
  AvailabilityController.deleteAvailability(req, res);
});

module.exports = router;