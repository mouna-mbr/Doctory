const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/ReviewController");
const { authMiddleware } = require("../middlewares/authMiddleware");

console.log("Review routes loaded");

// Middleware de logging
router.use((req, res, next) => {
  console.log(`[ReviewRoutes] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES PUBLIQUES
// ============================================

// Avis d'un docteur (public)
router.get("/doctor/:targetId", (req, res) => {
  req.params.reviewType = "DOCTOR";
  ReviewController.getReviews(req, res);
});

// Avis d'un pharmacien (public)
router.get("/pharmacist/:targetId", (req, res) => {
  req.params.reviewType = "PHARMACIST";
  ReviewController.getReviews(req, res);
});

// Avis d'un utilisateur (public)
router.get("/user/:targetId", (req, res) => {
  req.params.reviewType = "USER";
  ReviewController.getReviews(req, res);
});

// ============================================
// ROUTES PRIVÉES (nécessitent authentification)
// ============================================
router.use(authMiddleware);

// Créer un avis
router.post("/", ReviewController.createReview);

// Obtenir mes propres avis
router.get("/my", ReviewController.getMyReviews);

// Statistiques de mes avis
router.get("/stats", ReviewController.getReviewStats);

// Mettre à jour un avis
router.put("/:id", ReviewController.updateReview);

// Supprimer un avis
router.delete("/:id", ReviewController.deleteReview);

// Ajouter une réponse à un avis
router.post("/:id/response", ReviewController.addResponse);

module.exports = router;