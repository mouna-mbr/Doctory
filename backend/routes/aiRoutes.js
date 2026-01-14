const express = require("express");
const router = express.Router();

console.log("🔄 Chargement des routes AI...");

// Spécialités médicales
const medicalSpecialties = {
  dentiste: {
    name: "Dentiste",
    description: "Spécialiste des problèmes dentaires",
    icon: "🦷",
    key: "dentiste"
  },
  generaliste: {
    name: "Médecin Généraliste",
    description: "Premier recours pour tous problèmes",
    icon: "👨‍⚕️",
    key: "generaliste"
  },
  cardiologue: {
    name: "Cardiologue",
    description: "Spécialiste du cœur et des vaisseaux",
    icon: "❤️",
    key: "cardiologue"
  },
  pneumologue: {
    name: "Pneumologue",
    description: "Spécialiste des poumons et respiration",
    icon: "🌬️",
    key: "pneumologue"
  }
};

// Réponses pré-définies pour le mode sans Groq
const predefinedResponses = {
  "bonjour": "👋 Bonjour ! Je suis votre assistant médical. Décrivez vos symptômes et je vous orienterai vers la spécialité appropriée.",
  "mal aux dents": "Je comprends que vous avez mal aux dents. Je vous recommande de consulter un **dentiste** dès que possible. En attendant, évitez les aliments chauds/froids/sucrés.",
  "douleur thoracique": "⚠️ Une douleur thoracique doit être prise au sérieux. Consultez rapidement un **cardiologue** ou rendez-vous aux urgences si la douleur est intense.",
  "toux": "Pour une toux persistante, consultez un **médecin généraliste** qui pourra vous orienter vers un pneumologue si nécessaire.",
  "fièvre": "En cas de fièvre, consultez un **médecin généraliste**. Reposez-vous et hydratez-vous bien en attendant.",
  "maux de tête": "Pour des maux de tête récurrents, consultez un **médecin généraliste** qui pourra vous orienter vers un neurologue si besoin."
};

// Détecter la spécialité depuis le message
const detectSpecialty = (message) => {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes("dent") || lowerMsg.includes("dents") || lowerMsg.includes("dentiste")) {
    return medicalSpecialties.dentiste;
  }
  if (lowerMsg.includes("cœur") || lowerMsg.includes("cardia") || lowerMsg.includes("thoracique")) {
    return medicalSpecialties.cardiologue;
  }
  if (lowerMsg.includes("toux") || lowerMsg.includes("respirer") || lowerMsg.includes("poumon")) {
    return medicalSpecialties.pneumologue;
  }
  
  return medicalSpecialties.generaliste;
};

// Route de test
router.get("/test", (req, res) => {
  console.log("✅ Route /test appelée");
  res.json({
    success: true,
    message: "Route AI fonctionnelle (mode sans Groq)",
    timestamp: new Date().toISOString()
  });
});

// Route ping
router.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Service AI opérationnel",
    status: "online",
    timestamp: new Date().toISOString()
  });
});

// Route principale du chatbot (SANS Groq pour l'instant)
router.post("/chat", async (req, res) => {
  console.log("📨 POST /chat appelé");
  console.log("Body:", req.body);
  
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Message requis",
        received: message
      });
    }
    
    console.log(`📝 Message reçu: "${message}"`);
    
    // Détecter la spécialité
    const specialty = detectSpecialty(message);
    console.log(`🎯 Spécialité détectée: ${specialty.name}`);
    
    // Trouver une réponse pré-définie ou générer une réponse générique
    const lowerMsg = message.toLowerCase();
    let aiResponse = predefinedResponses["bonjour"]; // réponse par défaut
    
    for (const [key, response] of Object.entries(predefinedResponses)) {
      if (lowerMsg.includes(key)) {
        aiResponse = response;
        break;
      }
    }
    
    // Si pas de réponse pré-définie, générer une réponse générique
    if (aiResponse === predefinedResponses["bonjour"] && !lowerMsg.includes("bonjour")) {
      aiResponse = `Je comprends que vous décrivez: "${message}". Je vous recommande de consulter un **${specialty.name.toLowerCase()}** pour une évaluation appropriée.`;
    }
    
    // Réponse réussie
    console.log("✅ Envoi réponse");
    res.json({
      success: true,
      type: "general",
      message: aiResponse,
      specialty: specialty,
      confidence: 75,
      timestamp: new Date().toISOString(),
      note: "Mode sans Groq - Réponses pré-définies"
    });
    
  } catch (error) {
    console.error("❌ Erreur dans /chat:", error.message);
    
    // Réponse d'erreur plus informative
    res.status(500).json({
      success: false,
      error: "Erreur interne",
      message: "Désolé, une erreur est survenue. Veuillez réessayer.",
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

console.log("✅ Routes AI chargées avec succès");
module.exports = router;