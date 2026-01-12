const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  // L'utilisateur qui écrit l'avis
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Informations sur le reviewer (pour éviter les joins)
  reviewerName: {
    type: String,
    required: true
  },
  
  // La cible de l'avis (docteur, pharmacien, ou utilisateur)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Type d'avis (DOCTOR, PHARMACIST, USER)
  reviewType: {
    type: String,
    enum: ["DOCTOR", "PHARMACIST", "USER"],
    required: true
  },
  
  // Note (1-5 étoiles)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Commentaire
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Date du service (optionnel)
  serviceDate: {
    type: Date
  },
  
  // Réponse du professionnel (optionnel)
  response: {
    text: String,
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
reviewSchema.index({ targetId: 1, reviewType: 1 });
reviewSchema.index({ reviewerId: 1 });

// Méthode statique pour calculer la note moyenne
reviewSchema.statics.calculateAverageRating = async function(targetId, reviewType) {
  const result = await this.aggregate([
    {
      $match: {
        targetId: mongoose.Types.ObjectId.isValid(targetId) 
          ? new mongoose.Types.ObjectId(targetId)
          : targetId,
        reviewType: reviewType
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  const avgRating = result.length > 0 ? result[0].averageRating : 0;
  const count = result.length > 0 ? result[0].reviewCount : 0;

  return {
    averageRating: parseFloat(avgRating.toFixed(1)),
    reviewCount: count
  };
};

// Hook pour mettre à jour la note moyenne après sauvegarde
reviewSchema.post("save", async function() {
  try {
    const Review = this.constructor;
    const User = mongoose.model("User");
    
    // Calculer la nouvelle moyenne
    const stats = await Review.calculateAverageRating(this.targetId, this.reviewType);
    
    // Mettre à jour l'utilisateur cible
    await User.findByIdAndUpdate(this.targetId, {
      rating: stats.averageRating,
      reviewsCount: stats.reviewCount
    });
  } catch (error) {
    console.error("Error updating user rating:", error);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;