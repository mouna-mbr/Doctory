const express = require("express");
const router = express.Router();
const AvailabilityController = require("../controllers/AvailabilityController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// All availability routes require authentication
router.use(authMiddleware);

// Create availability slot (Doctor only)
router.post("/", (req, res) => AvailabilityController.createAvailability(req, res));

// Get own availability (Doctor only)
router.get("/my", (req, res) => AvailabilityController.getMyAvailability(req, res));

// Get doctor's availability (public for authenticated users)
router.get("/doctor/:doctorId", (req, res) => AvailabilityController.getDoctorAvailability(req, res));

// Get available time slots for booking (public for authenticated users)
router.get("/doctor/:doctorId/slots", (req, res) => AvailabilityController.getAvailableSlots(req, res));

// Update availability slot (Doctor only)
router.put("/:id", (req, res) => AvailabilityController.updateAvailability(req, res));

// Delete availability slot (Doctor only)
router.delete("/:id", (req, res) => AvailabilityController.deleteAvailability(req, res));

module.exports = router;
