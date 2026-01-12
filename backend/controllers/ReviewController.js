const Review = require("../models/Review");
const User = require("../models/User");

const ReviewController = {
  // Créer un avis
  createReview: async (req, res) => {
    try {
      const reviewerId = req.user.userId;
      const { targetId, reviewType, rating, comment, serviceDate } = req.body;
      
      // Validation des données
      if (!targetId || !reviewType || !rating || !comment) {
        return res.status(400).json({
          success: false,
          message: "Données manquantes"
        });
      }

      // Vérifier que l'utilisateur existe
      const reviewer = await User.findById(reviewerId);
      if (!reviewer) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }

      // Vérifier que la cible existe
      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur cible non trouvé"
        });
      }

      // Vérifier que l'utilisateur ne s'auto-évalue pas
      if (reviewerId === targetId) {
        return res.status(400).json({
          success: false,
          message: "Vous ne pouvez pas vous évaluer vous-même"
        });
      }

      // Vérifier si l'utilisateur a déjà laissé un avis
      const existingReview = await Review.findOne({
        reviewerId,
        targetId,
        reviewType
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "Vous avez déjà laissé un avis pour cette personne"
        });
      }

      // Créer l'avis
      const reviewData = {
        reviewerId,
        reviewerName: reviewer.fullName,
        targetId,
        reviewType,
        rating: parseInt(rating),
        comment: comment.trim()
      };

      if (serviceDate) {
        reviewData.serviceDate = new Date(serviceDate);
      }

      const review = new Review(reviewData);
      await review.save();

      res.status(201).json({
        success: true,
        message: "Avis ajouté avec succès",
        data: review
      });

    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de l'avis",
        error: error.message
      });
    }
  },

  // Obtenir les avis d'une cible (docteur, pharmacien, utilisateur)
  getReviews: async (req, res) => {
    try {
      const { targetId, reviewType } = req.params;
      
      // Vérifier que la cible existe
      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }

      // Récupérer les avis
      const reviews = await Review.find({
        targetId,
        reviewType
      })
      .sort({ createdAt: -1 })
      .select("reviewerName rating comment createdAt serviceDate response")
      .limit(100);

      // Calculer les statistiques
      const stats = await Review.calculateAverageRating(targetId, reviewType);

      res.status(200).json({
        success: true,
        data: reviews,
        stats: {
          averageRating: stats.averageRating,
          reviewCount: stats.reviewCount
        },
        targetInfo: {
          name: targetUser.fullName,
          role: targetUser.role,
          specialty: targetUser.specialty,
          pharmacyName: targetUser.pharmacyName
        }
      });

    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des avis",
        error: error.message
      });
    }
  },

  // Obtenir mes propres avis (ceux que j'ai écrits)
  getMyReviews: async (req, res) => {
    try {
      const userId = req.user.userId;

      const reviews = await Review.find({
        reviewerId: userId
      })
      .sort({ createdAt: -1 })
      .populate("targetId", "fullName role specialty pharmacyName profileImage")
      .limit(50);

      res.status(200).json({
        success: true,
        data: reviews,
        count: reviews.length
      });

    } catch (error) {
      console.error("Error fetching my reviews:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de vos avis",
        error: error.message
      });
    }
  },

  // Mettre à jour un avis
  updateReview: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { rating, comment } = req.body;

      const review = await Review.findById(id);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Avis non trouvé"
        });
      }

      // Vérifier que l'utilisateur est le propriétaire
      if (review.reviewerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Vous n'êtes pas autorisé à modifier cet avis"
        });
      }

      // Mettre à jour
      if (rating !== undefined) review.rating = parseInt(rating);
      if (comment !== undefined) review.comment = comment.trim();
      
      await review.save();

      res.status(200).json({
        success: true,
        message: "Avis mis à jour avec succès",
        data: review
      });

    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de l'avis",
        error: error.message
      });
    }
  },

  // Supprimer un avis
  deleteReview: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const review = await Review.findById(id);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Avis non trouvé"
        });
      }

      // Vérifier que l'utilisateur est le propriétaire
      if (review.reviewerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Vous n'êtes pas autorisé à supprimer cet avis"
        });
      }

      await review.deleteOne();

      res.status(200).json({
        success: true,
        message: "Avis supprimé avec succès"
      });

    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de l'avis",
        error: error.message
      });
    }
  },

  // Ajouter une réponse à un avis
  addResponse: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { responseText } = req.body;

      const review = await Review.findById(id);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Avis non trouvé"
        });
      }

      // Vérifier que l'utilisateur est la cible de l'avis
      if (review.targetId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Seul la personne concernée peut répondre"
        });
      }

      // Vérifier qu'il n'y a pas déjà une réponse
      if (review.response && review.response.text) {
        return res.status(400).json({
          success: false,
          message: "Une réponse existe déjà pour cet avis"
        });
      }

      // Ajouter la réponse
      review.response = {
        text: responseText.trim(),
        respondedAt: new Date()
      };
      
      await review.save();

      res.status(200).json({
        success: true,
        message: "Réponse ajoutée avec succès",
        data: review
      });

    } catch (error) {
      console.error("Error adding response:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'ajout de la réponse",
        error: error.message
      });
    }
  },

  // Obtenir les statistiques des avis
  getReviewStats: async (req, res) => {
    try {
      const userId = req.user.userId;

      // Récupérer tous les avis pour cet utilisateur
      const reviews = await Review.find({
        targetId: userId
      });

      // Calculer les statistiques
      let totalRating = 0;
      let ratingCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let recentReviews = [];

      reviews.forEach(review => {
        totalRating += review.rating;
        ratingCount[review.rating]++;
        
        // Garder les 10 derniers avis
        if (recentReviews.length < 10) {
          recentReviews.push({
            reviewerName: review.reviewerName,
            rating: review.rating,
            comment: review.comment,
            date: review.createdAt
          });
        }
      });

      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

      res.status(200).json({
        success: true,
        data: {
          totalReviews: reviews.length,
          averageRating: parseFloat(averageRating.toFixed(1)),
          ratingDistribution: ratingCount,
          recentReviews: recentReviews.sort((a, b) => new Date(b.date) - new Date(a.date))
        }
      });

    } catch (error) {
      console.error("Error getting review stats:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques",
        error: error.message
      });
    }
  }
};

module.exports = ReviewController;