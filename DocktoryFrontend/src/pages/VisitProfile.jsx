"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaStar, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaUserMd, 
  FaPhone, 
  FaEnvelope,
  FaGraduationCap,
  FaMoneyBill,
  FaArrowLeft,
  FaHospital,
  FaUser,
  FaPills,
  FaComment,
  FaCalendarPlus
} from "react-icons/fa";
import "../assets/css/VisitProfile.css";

const VisitProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ""
  });
  
  // État pour les disponibilités (si c'est un docteur)
  const [availability, setAvailability] = useState([]);
  const [availabilityPage, setAvailabilityPage] = useState(1);
  const [availabilityPerPage, setAvailabilityPerPage] = useState(5);
  
  // État pour les médicaments (si c'est un pharmacien)
  const [medications, setMedications] = useState([]);
  
  const API_BASE_URL = "http://localhost:5000/api";
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Récupérer les infos de l'utilisateur
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        const userData = data.data || data;
        setUser(userData);
        
        // Récupérer les avis
        fetchReviews(userData.role);
        
        // Si c'est un docteur, récupérer les disponibilités
        if (userData.role === "DOCTOR") {
          fetchDoctorAvailability();
        }
        
        // Si c'est un pharmacien, récupérer les médicaments
        if (userData.role === "PHARMACIST") {
          fetchMedications();
        }
      } else {
        setError("Utilisateur non trouvé");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

const fetchReviews = async (role) => {
  try {
    let endpoint = "";
    let reviewType = "";
    
    switch(role) {
      case "DOCTOR":
        endpoint = `${API_BASE_URL}/reviews/doctor/${userId}`;
        reviewType = "DOCTOR";
        break;
      case "PHARMACIST":
        endpoint = `${API_BASE_URL}/reviews/pharmacist/${userId}`;
        reviewType = "PHARMACIST";
        break;
      default:
        endpoint = `${API_BASE_URL}/reviews/user/${userId}`;
        reviewType = "USER";
    }
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (data.success) {
      setReviews(data.data || []);
      // Mettre à jour les stats de l'utilisateur
      if (user) {
        setUser(prev => ({
          ...prev,
          rating: data.stats?.averageRating || 0,
          reviewsCount: data.stats?.reviewCount || 0
        }));
      }
    }
  } catch (err) {
    console.error("Error fetching reviews:", err);
  }
};
const fetchDoctorAvailability = async () => {
  try {
    const token = localStorage.getItem("token");
    const headers = {};
    
    // Ajouter le token seulement s'il existe
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers["Content-Type"] = "application/json";
    }
    
    const response = await fetch(`${API_BASE_URL}/availability/doctor/${userId}`, { 
      headers 
    });
    
    if (response.status === 401) {
      // Si non autorisé, cela signifie que la route nécessite une authentification
      // Nous pourrions soit cacher la section, soit afficher un message
      setAvailability([]);
      return;
    }
    
    const data = await response.json();
    if (data.success) {
      setAvailability(data.data || []);
    }
  } catch (err) {
    console.error("Error fetching availability:", err);
    setAvailability([]);
  }
};

  const fetchMedications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pharmacy/medications/${userId}`);
      const data = await response.json();
      if (data.success) {
        setMedications(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching medications:", err);
    }
  };

  const handleSubmitReview = async () => {
    if (!localStorage.getItem("token")) {
      alert("Veuillez vous connecter pour ajouter un avis");
      navigate("/signin");
      return;
    }

    if (!newReview.comment.trim()) {
      alert("Veuillez écrire un commentaire");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      // Déterminer le type de review selon le rôle de l'utilisateur
      let reviewType = "USER";
      if (user.role === "DOCTOR") {
        reviewType = "DOCTOR";
      } else if (user.role === "PHARMACIST") {
        reviewType = "PHARMACIST";
      }

      const reviewData = {
        targetId: userId,
        reviewType: reviewType,
        rating: newReview.rating,
        comment: newReview.comment
      };

      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Avis ajouté avec succès!");
        setShowReviewForm(false);
        setNewReview({ rating: 5, comment: "" });
        fetchReviews(user.role); // Rafraîchir les avis
      } else {
        alert("Erreur: " + data.message);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Erreur lors de l'ajout de l'avis");
    }
  };

  const handleBookAppointment = () => {
    if (!localStorage.getItem("token")) {
      alert("Veuillez vous connecter pour prendre un rendez-vous");
      navigate("/signin");
      return;
    }
    
    navigate(`/appointment/${userId}?doctor=${encodeURIComponent(user.fullName)}&specialty=${encodeURIComponent(user.specialty || "")}`);
  };

  const handleContact = () => {
    if (user.phoneNumber) {
      window.location.href = `tel:${user.phoneNumber}`;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Formater la date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Date inconnue";
      
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return "Date invalide";
    }
  };

  // Formater l'heure
  const formatTime = (timeString) => {
    try {
      if (!timeString) return "Heure inconnue";
      
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes || 0), 0);
        return date.toLocaleTimeString("fr-FR", {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else if (timeString.includes('T')) {
        return new Date(timeString).toLocaleTimeString("fr-FR", {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return timeString;
    } catch (err) {
      return "Heure invalide";
    }
  };

  // Pagination pour les disponibilités
  const getPaginatedAvailability = () => {
    const startIndex = (availabilityPage - 1) * availabilityPerPage;
    const endIndex = startIndex + availabilityPerPage;
    return availability.slice(startIndex, endIndex);
  };

  const totalAvailabilityPages = Math.ceil(availability.length / availabilityPerPage);

  if (loading) {
    return (
      <div className="visit-profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="visit-profile-container">
        <div className="error-state">
          <h3>{error || "Utilisateur non trouvé"}</h3>
          <button className="btn-primary" onClick={handleBack}>
            <FaArrowLeft /> Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="visit-profile-container">
      {/* Bouton retour */}
      <button className="back-btn" onClick={handleBack}>
        <FaArrowLeft /> Retour
      </button>

      {/* En-tête du profil */}
      <div className="profile-header">
        <div className="profile-avatar-visit-profile">
        <img 
          src={
            user.profileImage 
              ? `http://localhost:5000${user.profileImage}`
              : `https://ui-avatars.com/api/?name=${user.fullName}&background=1B2688&color=fff&size=150`
          } 
          alt="profile" 
          className="profile-avatar" 
        />
          <div className={`role-badge ${user.role.toLowerCase()}`}>
            {user.role === "DOCTOR" ? <FaUserMd /> : 
             user.role === "PHARMACIST" ? <FaPills /> : 
             <FaUser />} {user.role}
          </div>
        </div>
        
        <div className="profile-header-info">
          <h1>{user.fullName}</h1>
          
          {user.role === "DOCTOR" && user.specialty && (
            <div className="specialty-badge">{user.specialty}</div>
          )}
          
          {user.role === "PHARMACIST" && user.pharmacyName && (
            <div className="pharmacy-name">{user.pharmacyName}</div>
          )}
          
          <div className="profile-stats">
            {user.role === "DOCTOR" && (
              <>
                <div className="stat-item">
                  <FaStar className="star-icon" />
                  <div>
                    <span className="stat-value">
                      {reviews.length > 0 
                        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
                        : "N/A"}
                    </span>
                    <span className="stat-label">Note</span>
                  </div>
                </div>
                
                <div className="stat-item">
                  <FaGraduationCap />
                  <div>
                    <span className="stat-value">{user.yearsOfExperience || 0} ans</span>
                    <span className="stat-label">Expérience</span>
                  </div>
                </div>
                
                <div className="stat-item">
                  <FaMoneyBill />
                  <div>
                    <span className="stat-value">{user.consultationPrice || 50} DT</span>
                    <span className="stat-label">Consultation</span>
                  </div>
                </div>
              </>
            )}
            
            {user.role === "PHARMACIST" && (
              <>
                <div className="stat-item">
                  <FaStar className="star-icon" />
                  <div>
                    <span className="stat-value">
                      {reviews.length > 0 
                        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
                        : "N/A"}
                    </span>
                    <span className="stat-label">Note</span>
                  </div>
                </div>
                
                <div className="stat-item">
                  <FaPills />
                  <div>
                    <span className="stat-value">{medications.length}</span>
                    <span className="stat-label">Médicaments</span>
                  </div>
                </div>
              </>
            )}
            
            <div className="stat-item">
              <FaComment />
              <div>
                <span className="stat-value">{reviews.length}</span>
                <span className="stat-label">Avis</span>
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            {user.role === "DOCTOR" && (
              <button className="book-btn" onClick={handleBookAppointment}>
                <FaCalendarAlt /> Prendre RDV
              </button>
            )}
            
            {user.phoneNumber && (
              <button className="contact-btn" onClick={handleContact}>
                <FaPhone /> Contacter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Informations détaillées */}
      <div className="profile-details-grid">
        {/* Colonne gauche */}
        <div className="left-column">
          {/* À propos */}
          <section className="profile-section">
            <h2>À propos</h2>
            <p className="about-text">
              {user.bio || user.description || "Aucune description disponible."}
            </p>
            
            <div className="info-list">
              <div className="info-item">
                <FaEnvelope />
                <span><strong>Email:</strong> {user.email || "Non disponible"}</span>
              </div>
              
              <div className="info-item">
                <FaPhone />
                <span><strong>Téléphone:</strong> {user.phoneNumber || "Non disponible"}</span>
              </div>
              
              {user.location && (
                <div className="info-item">
                  <FaMapMarkerAlt />
                  <span><strong>Localisation:</strong> {user.location || user.city || "Non spécifiée"}</span>
                </div>
              )}
              
              {user.role === "DOCTOR" && user.yearsOfExperience && (
                <div className="info-item">
                  <FaGraduationCap />
                  <span><strong>Expérience:</strong> {user.yearsOfExperience} ans</span>
                </div>
              )}
              
              {user.role === "DOCTOR" && user.consultationPrice && (
                <div className="info-item">
                  <FaMoneyBill />
                  <span><strong>Tarif consultation:</strong> {user.consultationPrice} DT</span>
                </div>
              )}
              
              {user.role === "PHARMACIST" && user.pharmacyAddress && (
                <div className="info-item">
                  <FaHospital />
                  <span><strong>Adresse pharmacie:</strong> {user.pharmacyAddress}</span>
                </div>
              )}
            </div>
          </section>

          {/* Avis */}
          <section className="profile-section reviews-section">
            <div className="section-header">
              <h2>⭐ Avis ({reviews.length})</h2>
              <button 
                className="add-review-btn"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                <FaComment /> Ajouter un avis
              </button>
            </div>
            
            {/* Formulaire d'avis */}
            {showReviewForm && (
              <div className="review-form">
                <h3>Votre avis</h3>
                <div className="rating-input">
                  <label>Note:</label>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= newReview.rating ? 'active' : ''}`}
                        onClick={() => setNewReview({...newReview, rating: star})}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="rating-text">{newReview.rating}/5</span>
                </div>
                <div className="comment-input">
                  <label>Commentaire:</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    placeholder="Partagez votre expérience..."
                    rows="4"
                  />
                </div>
                <div className="form-actions">
                  <button className="submit-btn" onClick={handleSubmitReview}>
                    Publier l'avis
                  </button>
                  <button className="cancel-btn" onClick={() => setShowReviewForm(false)}>
                    Annuler
                  </button>
                </div>
              </div>
            )}
            
            {/* Liste des avis */}
            {reviews.length === 0 ? (
              <div className="empty-state">
                <p>Aucun avis pour le moment. Soyez le premier à évaluer!</p>
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map((review, index) => (
                  <div key={review._id || index} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <strong>{review.patientName || review.userName || "Anonyme"}</strong>
                        <div className="review-rating">
                          {"★".repeat(review.rating || 5)}
                          <span className="rating-text">{review.rating || 5}/5</span>
                        </div>
                      </div>
                      <span className="review-date">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Colonne droite */}
        <div className="right-column">
          {/* Disponibilités (Docteur seulement) */}
          {user.role === "DOCTOR" && (
            <section className="profile-section availability-section">
              <div className="section-header">
                <h2><FaCalendarAlt /> Disponibilités</h2>
                <span className="count-badge">{availability.length} créneau{availability.length > 1 ? 'x' : ''}</span>
              </div>
              
              {availability.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune disponibilité programmée pour le moment</p>
                </div>
              ) : (
                <>
                  <div className="availability-list">
                    {getPaginatedAvailability().map((slot, index) => (
                      <div key={slot._id || index} className="availability-card">
                        <FaClock className="clock-icon" />
                        <div className="slot-details">
                          <h4>{formatDate(slot.date || slot.startDateTime)}</h4>
                          <p>
                            {formatTime(slot.startTime || slot.startDateTime)} -{" "}
                            {formatTime(slot.endTime || slot.endDateTime)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalAvailabilityPages > 1 && (
                    <div className="availability-pagination">
                      <div className="pagination-controls">
                        <button
                          className="pagination-btn"
                          onClick={() => setAvailabilityPage(prev => Math.max(1, prev - 1))}
                          disabled={availabilityPage === 1}
                        >
                          Précédent
                        </button>
                        <span>Page {availabilityPage} sur {totalAvailabilityPages}</span>
                        <button
                          className="pagination-btn"
                          onClick={() => setAvailabilityPage(prev => Math.min(totalAvailabilityPages, prev + 1))}
                          disabled={availabilityPage === totalAvailabilityPages}
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Médicaments (Pharmacien seulement) */}
          {user.role === "PHARMACIST" && medications.length > 0 && (
            <section className="profile-section medications-section">
              <div className="section-header">
                <h2><FaPills /> Médicaments disponibles</h2>
                <span className="count-badge">{medications.length}</span>
              </div>
              
              <div className="medications-list">
                {medications.slice(0, 5).map((med, index) => (
                  <div key={med._id || index} className="medication-card">
                    <h4>{med.name}</h4>
                    <p className="med-price">{med.price || "N/A"} DT</p>
                    <p className="med-quantity">Quantité: {med.quantity || "N/A"}</p>
                  </div>
                ))}
                
                {medications.length > 5 && (
                  <button className="view-all-btn">
                    Voir tous les {medications.length} médicaments
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Autres informations */}
          <section className="profile-section info-section">
            <h2>Informations</h2>
            <div className="info-box">
              <p><strong>Membre depuis:</strong> {formatDate(user.createdAt)}</p>
              <p><strong>Statut:</strong> <span className="status-active">✓ Actif</span></p>
              
              {user.role === "DOCTOR" && (
                <>
                  <p><strong>Spécialité:</strong> {user.specialty || "Non spécifiée"}</p>
                  <p><strong>Langues parlées:</strong> {user.languages || "Français, Anglais"}</p>
                </>
              )}
              
              {user.role === "PHARMACIST" && (
                <>
                  <p><strong>Heures d'ouverture:</strong> {user.openingHours || "8h-18h"}</p>
                  <p><strong>Services:</strong> {user.services || "Vente de médicaments, Conseils"}</p>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Boutons d'action fixe en bas */}
      <div className="fixed-action-bar">
        <div className="action-summary">
          {user.role === "DOCTOR" && (
            <span className="price-tag">
              <FaMoneyBill /> {user.consultationPrice || 50} DT / consultation
            </span>
          )}
          <span className="rating-summary">
            <FaStar /> {reviews.length} avis
          </span>
        </div>
        
        <div className="action-buttons-visit-profile">
          {user.phoneNumber && (
            <button className="contact-btn-fixed" onClick={handleContact}>
              <FaPhone /> Appeler
            </button>
          )}
          
          {user.role === "DOCTOR" && (
            <button className="book-btn-fixed" onClick={handleBookAppointment}>
              <FaCalendarAlt /> Prendre RDV
            </button>
          )}
          
          {currentUser && currentUser._id !== user._id && currentUser._id !== user.id && (
            <button 
              className="review-btn-fixed"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              <FaComment /> {showReviewForm ? "Annuler" : "Noter"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitProfile;