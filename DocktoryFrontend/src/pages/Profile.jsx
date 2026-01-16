"use client"
import { useState, useEffect } from "react"
import { FaCalendarAlt, FaClock, FaCalendarPlus, FaCalendarCheck, FaCalendarTimes, FaArrowLeft, FaArrowRight, FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa"
import "../assets/css/Profile.css"

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: "",
    startTime: "",
    endTime: ""
  });

  // États pour les avis REÇUS
  const [receivedReviews, setReceivedReviews] = useState([]); // Avis que les autres ont donnés sur moi
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [receivedReviewsPage, setReceivedReviewsPage] = useState(1);
  const [reviewsPerPage, setReviewsPerPage] = useState(5);

  // États pour les réponses aux avis
  const [responseTexts, setResponseTexts] = useState({}); // {reviewId: "texte"}
  const [respondingTo, setRespondingTo] = useState(null); // ID de l'avis en cours de réponse
  const [responseLoading, setResponseLoading] = useState({}); // {reviewId: true/false}

  // États pour la pagination des rendez-vous
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(3);

  // États pour la pagination des disponibilités
  const [availabilityPage, setAvailabilityPage] = useState(1);
  const [availabilityPerPage, setAvailabilityPerPage] = useState(3);

  // États pour la gestion du compte
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        
        if (!token || !userData) {
          window.location.href = "/signin";
          return;
        }

        const userInfo = JSON.parse(userData);
        
        const response = await fetch(`${API_BASE_URL}/users/${userInfo.id}?t=${Date.now()}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });

        const data = await response.json();

        if (data.success) {
          const userData = data.data;
          setUser(userData);
          
          if (userData.role === "PATIENT") {
            await fetchPatientAppointments(token);
          } else if (userData.role === "DOCTOR" || userData.role === "PHARMACIST") {
            await fetchDoctorData(token, userData._id || userData.id);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fonction pour récupérer les avis que les autres ont donnés SUR MOI (avis reçus)
  const fetchReceivedReviews = async () => {
    // Vérifier que user existe avant de continuer
    if (!user) {
      console.error("User is null, cannot fetch reviews");
      setReviewsError("Utilisateur non chargé");
      return;
    }
    
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      
      const token = localStorage.getItem("token");
      const userId = user._id || user.id;
      
      if (!userId) {
        console.error("User ID not found");
        setReceivedReviews([]);
        return;
      }
      
      console.log("Fetching reviews RECEIVED about me, User ID:", userId);
      console.log("My role:", user.role);
      
      // 1. D'abord, essayez d'utiliser la route /reviews/my qui retourne TOUS les avis
      console.log("Trying route: /reviews/my");
      const response = await fetch(`${API_BASE_URL}/reviews/my`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      console.log("Response from /reviews/my:", data);
      
      if (data.success && Array.isArray(data.data)) {
        // Filtrer pour obtenir seulement les avis où JE SUIS LA CIBLE (targetId)
        const reviewsAboutMe = data.data.filter(review => {
          const targetId = review.targetId;
          
          // Vérifier si l'avis est destiné à MOI (je suis la cible)
          if (!targetId) return false;
          
          // Si targetId est un objet
          if (typeof targetId === 'object') {
            const isAboutMe = targetId._id === userId || targetId.id === userId;
            if (isAboutMe) {
              console.log(`Found review ABOUT ME: ${review.comment?.substring(0, 50)}...`);
            }
            return isAboutMe;
          }
          
          // Si targetId est une string
          if (typeof targetId === 'string') {
            const isAboutMe = targetId === userId;
            if (isAboutMe) {
              console.log(`Found review ABOUT ME (string ID): ${review.comment?.substring(0, 50)}...`);
            }
            return isAboutMe;
          }
          
          return false;
        });
        
        console.log(`Total reviews: ${data.data.length}, Reviews ABOUT ME: ${reviewsAboutMe.length}`);
        
        if (reviewsAboutMe.length > 0) {
          console.log("Reviews ABOUT ME found:", reviewsAboutMe);
          setReceivedReviews(reviewsAboutMe);
          
          // Calculer la note moyenne basée sur les avis reçus
          const averageRating = reviewsAboutMe.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewsAboutMe.length;
          setUser(prev => ({
            ...prev,
            rating: averageRating,
            reviewsCount: reviewsAboutMe.length
          }));
        } else {
          console.log("No reviews found ABOUT ME, trying alternative routes...");
          // Essayez les routes publiques selon le rôle
          await tryAlternativeRoutes(token, userId);
        }
      } else {
        console.log("API returned error or no data array, trying alternative routes...");
        await tryAlternativeRoutes(token, userId);
      }
    } catch (err) {
      console.error("Error fetching received reviews:", err);
      setReviewsError("Erreur lors du chargement des avis reçus");
      setReceivedReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fonction pour essayer d'autres routes si /reviews/my ne fonctionne pas
  const tryAlternativeRoutes = async (token, userId) => {
    try {
      let endpoint = "";
      
      // Selon votre rôle, essayez les routes publiques
      if (user.role === "DOCTOR") {
        endpoint = `${API_BASE_URL}/reviews/doctor/${userId}`;
      } else if (user.role === "PHARMACIST") {
        endpoint = `${API_BASE_URL}/reviews/pharmacist/${userId}`;
      } else {
        endpoint = `${API_BASE_URL}/reviews/user/${userId}`;
      }
      
      console.log(`Trying alternative route: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Alternative route response:", data);
        
        if (data.success) {
          if (Array.isArray(data.data)) {
            setReceivedReviews(data.data);
            
            // Calculer la note moyenne
            if (data.data.length > 0) {
              const averageRating = data.data.reduce((sum, review) => sum + (review.rating || 0), 0) / data.data.length;
              setUser(prev => ({
                ...prev,
                rating: averageRating,
                reviewsCount: data.data.length
              }));
            }
          } else if (data.data) {
            // Si ce n'est pas un tableau mais un objet unique
            setReceivedReviews([data.data]);
            setUser(prev => ({
              ...prev,
              rating: data.data.rating || 0,
              reviewsCount: 1
            }));
          }
        }
      } else {
        console.log(`Alternative route failed with status: ${response.status}`);
        setReceivedReviews([]);
      }
    } catch (err) {
      console.error("Error trying alternative routes:", err);
      setReceivedReviews([]);
    }
  };

  // Fonction pour démarrer la réponse à un avis
  const startResponse = (reviewId) => {
    setRespondingTo(reviewId);
    setResponseTexts(prev => ({
      ...prev,
      [reviewId]: ""
    }));
  };

  // Fonction pour annuler la réponse
  const cancelResponse = (reviewId) => {
    setRespondingTo(null);
    setResponseTexts(prev => ({
      ...prev,
      [reviewId]: ""
    }));
  };

  // Fonction pour soumettre une réponse à un avis
  const handleSubmitResponse = async (reviewId) => {
    const responseText = responseTexts[reviewId]?.trim();
    
    if (!responseText) {
      alert("Veuillez écrire une réponse");
      return;
    }

    try {
      setResponseLoading(prev => ({ ...prev, [reviewId]: true }));
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/response`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ responseText })
      });

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour l'avis localement avec la nouvelle réponse
        setReceivedReviews(prev => prev.map(review => 
          review._id === reviewId 
            ? { 
                ...review, 
                response: {
                  text: responseText,
                  respondedAt: new Date().toISOString(),
                  ...data.data.response
                }
              }
            : review
        ));
        
        // Réinitialiser le champ de réponse
        setRespondingTo(null);
        setResponseTexts(prev => ({ ...prev, [reviewId]: "" }));
        
        alert("Réponse ajoutée avec succès!");
      } else {
        alert("Erreur: " + (data.message || "Impossible d'ajouter la réponse"));
      }
    } catch (err) {
      console.error("Error adding response:", err);
      alert("Erreur lors de l'ajout de la réponse");
    } finally {
      setResponseLoading(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const fetchPatientAppointments = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAppointments(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  const fetchDoctorData = async (token, doctorId) => {
    try {
      // Fetch doctor's appointments
      const appointmentsRes = await fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const appointmentsData = await appointmentsRes.json();
      if (appointmentsData.success) {
        setAppointments(appointmentsData.data || []);
      }

      // Fetch doctor's availability
      const availabilityRes = await fetch(`${API_BASE_URL}/availability/my`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const availabilityData = await availabilityRes.json();
      if (availabilityData.success) {
        setAvailability(availabilityData.data || []);
      }
    } catch (err) {
      console.error("Error fetching doctor data:", err);
    }
  };

  const handleAddSlot = async () => {
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const slotData = {
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime
      };

      const response = await fetch(`${API_BASE_URL}/availability`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(slotData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Créneau ajouté avec succès!");
        setShowAddSlot(false);
        setNewSlot({ date: "", startTime: "", endTime: "" });
        
        // Refresh availability
        const availabilityRes = await fetch(`${API_BASE_URL}/availability/my`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const availabilityData = await availabilityRes.json();
        if (availabilityData.success) {
          setAvailability(availabilityData.data);
        }
      } else {
        alert("Erreur: " + data.message);
      }
    } catch (err) {
      console.error("Error adding slot:", err);
      alert("Erreur lors de l'ajout du créneau");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm("Supprimer ce créneau?")) return;
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/availability/${slotId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAvailability(availability.filter(slot => slot._id !== slotId));
        alert("Créneau supprimé avec succès");
      }
    } catch (err) {
      console.error("Error deleting slot:", err);
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/${action}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Rendez-vous ${action === "confirm" ? "confirmé" : "annulé"} avec succès!`);
        
        setAppointments(prev => prev.map(app => 
          app._id === appointmentId 
            ? { ...app, status: action === "confirm" ? "CONFIRMED" : "CANCELLED" }
            : app
        ));
      } else {
        alert("Erreur: " + data.message);
      }
    } catch (err) {
      console.error(`Error ${action} appointment:`, err);
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Date inconnue";
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      
      return date.toLocaleDateString("fr-FR", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      console.error("Error formatting date:", err, dateString);
      return "Date invalide";
    }
  };

  // Fonction pour formater l'heure
  const formatTime = (timeString) => {
    try {
      if (!timeString) return "Heure inconnue";
      
      // Si c'est un format HH:MM:SS ou HH:MM
      if (typeof timeString === 'string' && timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes || 0), 0);
        return date.toLocaleTimeString("fr-FR", {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      // Si c'est une date ISO
      else if (typeof timeString === 'string' && timeString.includes('T')) {
        const date = new Date(timeString);
        return date.toLocaleTimeString("fr-FR", {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return timeString;
    } catch (err) {
      console.error("Error formatting time:", err, timeString);
      return "Heure invalide";
    }
  };

  // Fonction pour afficher les étoiles
  const renderStars = (rating) => {
    const numRating = Number(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="stars-container">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="star-icon filled" />
        ))}
        {hasHalfStar && <FaStarHalfAlt className="star-icon half" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="star-icon empty" />
        ))}
        <span className="rating-text">{numRating.toFixed(1)}</span>
      </div>
    );
  };

  // Fonction pour obtenir la date d'un slot
  const getSlotDate = (slot) => {
    return slot.date || slot.startDateTime || "Date inconnue";
  };

  // Fonction pour obtenir l'heure de début d'un slot
  const getSlotStartTime = (slot) => {
    return slot.startTime || slot.startDateTime || "Heure inconnue";
  };

  // Fonction pour obtenir l'heure de fin d'un slot
  const getSlotEndTime = (slot) => {
    return slot.endTime || slot.endDateTime || "Heure inconnue";
  };

  // Fonction pour calculer les rendez-vous paginés
  const getPaginatedAppointments = () => {
    const startIndex = (appointmentsPage - 1) * appointmentsPerPage;
    const endIndex = startIndex + appointmentsPerPage;
    return appointments.slice(startIndex, endIndex);
  };

  // Fonction pour calculer les disponibilités paginées
  const getPaginatedAvailability = () => {
    const startIndex = (availabilityPage - 1) * availabilityPerPage;
    const endIndex = startIndex + availabilityPerPage;
    return availability.slice(startIndex, endIndex);
  };

  // Fonction pour calculer le nombre total de pages
  const getTotalPages = (items, perPage) => {
    return Math.ceil(items.length / perPage);
  };

  // Fonction pour changer de page (rendez-vous)
  const handleAppointmentsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= getTotalPages(appointments, appointmentsPerPage)) {
      setAppointmentsPage(newPage);
    }
  };

  // Fonction pour changer de page (disponibilités)
  const handleAvailabilityPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= getTotalPages(availability, availabilityPerPage)) {
      setAvailabilityPage(newPage);
    }
  };

  // Fonction pour générer les boutons de pagination
  const renderPagination = (currentPage, totalPages, handlePageChange, itemsName) => {
    if (totalPages <= 1) return null;

    const pages = [];
    
    // Toujours afficher la première page
    pages.push(1);
    
    // Ajouter des points de suspension si nécessaire avant
    if (currentPage > 3) {
      pages.push('...');
    }
    
    // Ajouter les pages autour de la page courante
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    // Ajouter des points de suspension si nécessaire après
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    // Toujours afficher la dernière page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          Affichage {((currentPage - 1) * (itemsName === 'appointments' ? appointmentsPerPage : availabilityPerPage) + 1)}-
          {Math.min(currentPage * (itemsName === 'appointments' ? appointmentsPerPage : availabilityPerPage), itemsName === 'appointments' ? appointments.length : availability.length)} 
          sur {itemsName === 'appointments' ? appointments.length : availability.length} {itemsName === 'appointments' ? 'rendez-vous' : 'créneaux'}
        </div>
        
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FaArrowLeft /> Précédent
          </button>
          
          <div className="pagination-numbers">
            {pages.map((page, index) => (
              page === '...' ? (
                <span key={`dots-${index}`} className="pagination-dots">...</span>
              ) : (
                <button
                  key={page}
                  className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )
            ))}
          </div>
          
          <button
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Suivant <FaArrowRight />
          </button>
        </div>

        {/* Sélecteur d'éléments par page */}
        <div className="per-page-selector">
          <label>Afficher : </label>
          <select
            value={itemsName === 'appointments' ? appointmentsPerPage : availabilityPerPage}
            onChange={(e) => {
              if (itemsName === 'appointments') {
                setAppointmentsPerPage(Number(e.target.value));
                setAppointmentsPage(1);
              } else {
                setAvailabilityPerPage(Number(e.target.value));
                setAvailabilityPage(1);
              }
            }}
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>
      </div>
    );
  };

  // Fonction pour désactiver le compte
  const handleDeactivateAccount = async () => {
    try {
      setDeactivating(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/users/${user._id || user.id}/deactivate`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Votre compte a été désactivé avec succès. Vous n'apparaîtrez plus dans la liste des médecins.");
        setShowDeactivateModal(false);
        
        // Mettre à jour l'état local
        setUser(prev => ({
          ...prev,
          isActive: false
        }));
      } else {
        alert("Erreur: " + (data.message || "Impossible de désactiver le compte"));
      }
    } catch (err) {
      console.error("Error deactivating account:", err);
      alert("Erreur lors de la désactivation du compte");
    } finally {
      setDeactivating(false);
    }
  };

  // Fonction pour réactiver le compte
  const handleReactivateAccount = async () => {
    try {
      setDeactivating(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/users/${user._id || user.id}/activate`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert("Votre compte a été réactivé avec succès. Vous apparaîtrez à nouveau dans la liste des médecins.");
        
        // Mettre à jour l'état local
        setUser(prev => ({
          ...prev,
          isActive: true
        }));
      } else {
        alert("Erreur: " + (data.message || "Impossible de réactiver le compte"));
      }
    } catch (err) {
      console.error("Error reactivating account:", err);
      alert("Erreur lors de la réactivation du compte");
    } finally {
      setDeactivating(false);
    }
  };

  // Fonction pour charger les avis quand on clique sur l'onglet "Mes Avis"
  const handleReviewsTabClick = () => {
    setActiveTab("reviews");
    
    // Attendre un tick pour s'assurer que activeTab est mis à jour
    setTimeout(() => {
      if (user) {
        // Pour TOUS les utilisateurs, on veut voir les avis reçus SUR EUX
        fetchReceivedReviews();
      }
    }, 100);
  };

  if (loading) {
    return <div className="profile-page">Chargement...</div>;
  }

  if (!user) {
    return <div className="profile-page">Erreur de chargement du profil</div>;
  }

  return (
    <div className="profile-page">
      {/* SIDEBAR */}
      <aside className="profile-sidebar">
        <img 
          src={
            user.profileImage 
              ? `http://localhost:5000${user.profileImage}`
              : `https://ui-avatars.com/api/?name=${user.fullName}&background=1B2688&color=fff&size=150`
          } 
          alt="profile" 
          className="profile-avatar" 
        />
        <h3>{user.fullName}</h3>
        <span className={`role-badge-profile ${user.role.toLowerCase()}`}>{user.role}</span>

        <ul>
          <li className={activeTab === "info" ? "active" : ""} onClick={() => setActiveTab("info")}>
            📄 Informations
          </li>
          <li className={activeTab === "appointments" ? "active" : ""} onClick={() => setActiveTab("appointments")}>
            <FaCalendarAlt /> Mes Rendez-vous
          </li>
          
          {user.role === "DOCTOR" && (
            <li className={activeTab === "availability" ? "active" : ""} onClick={() => setActiveTab("availability")}>
              <FaCalendarPlus /> Mes Disponibilités
            </li>
          )}
           {user.role !== "PATIENT" && (
             <li 
            className={activeTab === "reviews" ? "active" : ""} 
            onClick={handleReviewsTabClick}
          >
            ⭐ Mes Avis
          </li>
          )}
       
          <li>
            <a href="/settings">⚙️ Paramètres</a>
          </li>
        </ul>
      </aside>

      {/* MAIN CONTENT */}
      <main className="profile-content">
        {/* INFO TAB */}
        {activeTab === "info" && (
          <section className="card">
            <h2>Informations générales</h2>
            
            {/* Statut du compte */}
            {(user.role === "DOCTOR" || user.role === "PHARMACIST") && (
              <div className={`account-status-banner ${user.isActive ? 'active' : 'inactive'}`}>
                <div className="status-info">
                  <strong>Statut du compte:</strong> 
                  <span className={`status-label ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? "✅ Actif - Visible dans la liste" : "❌ Désactivé - Non visible dans la liste"}
                  </span>
                </div>
                {user.isActive ? (
                  <p className="status-description">
                    Votre profil est actuellement visible par les patients dans la liste des médecins.
                  </p>
                ) : (
                  <p className="status-description">
                    Votre profil est actuellement masqué. Les patients ne peuvent pas vous voir dans la liste des médecins.
                  </p>
                )}
              </div>
            )}
            
            <div className="info-grid">
              <p><strong>Email :</strong> {user.email}</p>
              <p><strong>Téléphone :</strong> {user.phoneNumber}</p>

              {user.role === "DOCTOR" && (
                <>
                  <p><strong>Spécialité :</strong> {user.specialty || "Non spécifiée"}</p>
                  <p><strong>Expérience :</strong> {user.yearsOfExperience || 0} ans</p>
                  <p><strong>Consultation :</strong> {user.consultationPrice || 0} DT</p>
                </>
              )}

              {user.role === "PHARMACIST" && (
                <p><strong>Pharmacie :</strong> {user.pharmacyName || "Non spécifiée"}</p>
              )}
            </div>
            
            {/* Gestion du compte pour Doctor/Pharmacist */}
            {(user.role === "DOCTOR" || user.role === "PHARMACIST") && (
              <div className="account-management">
                <h3>Gestion du compte</h3>
                <div className="account-actions">
                  {user.isActive ? (
                    <button 
                      className="btn-danger"
                      onClick={() => setShowDeactivateModal(true)}
                    >
                      🔒 Désactiver mon compte
                    </button>
                  ) : (
                    <button 
                      className="btn-success"
                      onClick={handleReactivateAccount}
                      disabled={deactivating}
                    >
                      {deactivating ? "Réactivation..." : "✅ Réactiver mon compte"}
                    </button>
                  )}
                  <p className="account-action-info">
                    {user.isActive 
                      ? "En désactivant votre compte, vous ne serez plus visible dans la liste des médecins et ne pourrez plus recevoir de nouvelles demandes de rendez-vous."
                      : "En réactivant votre compte, vous serez à nouveau visible dans la liste des médecins et pourrez recevoir des demandes de rendez-vous."
                    }
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === "appointments" && (
          <>
            <section className="card">
              <h2>
                <FaCalendarAlt /> Mes Rendez-vous
                <span className="badge">{appointments.length}</span>
              </h2>
              
              {appointments.length === 0 ? (
                <div className="empty-state">
                  <FaCalendarAlt size={48} />
                  <p>Aucun rendez-vous trouvé</p>
                  {user.role === "PATIENT" && (
                    <a href="/doctors" className="btn-primary">Prendre un rendez-vous</a>
                  )}
                </div>
              ) : (
                <>
                  <div className="appointments-list">
                    {getPaginatedAppointments().map(appointment => (
                      <div key={appointment._id} className="appointment-card">
                        <div className="appointment-header">
                          <div>
                            <h4>
                              {user.role === "PATIENT" 
                                ? `Dr. ${appointment.doctorId?.fullName || "Inconnu"}`
                                : `Patient: ${appointment.patientId?.fullName || "Inconnu"}`
                              }
                            </h4>
                            <p className="appointment-time">
                              <FaClock /> {formatDate(appointment.startDateTime)} 
                              <br />
                              {formatTime(appointment.startDateTime)} - {formatTime(appointment.endDateTime)}
                            </p>
                          </div>
                          <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        {appointment.reason && (
                          <p className="appointment-reason">Raison: {appointment.reason}</p>
                        )}
                        
                        <div className="appointment-actions">
                          {user.role === "DOCTOR" && appointment.status === "REQUESTED" && (
                            <>
                              <button 
                                className="btn-success"
                                onClick={() => handleAppointmentAction(appointment._id, "confirm")}
                              >
                                <FaCalendarCheck /> Confirmer
                              </button>
                              <button 
                                className="btn-danger"
                                onClick={() => handleAppointmentAction(appointment._id, "cancel")}
                              >
                                <FaCalendarTimes /> Refuser
                              </button>
                            </>
                          )}
                          
                          {user.role === "PATIENT" && appointment.status === "REQUESTED" && (
                            <button 
                              className="btn-danger"
                              onClick={() => handleAppointmentAction(appointment._id, "cancel")}
                            >
                              Annuler la demande
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination pour les rendez-vous */}
                  {renderPagination(
                    appointmentsPage, 
                    getTotalPages(appointments, appointmentsPerPage), 
                    handleAppointmentsPageChange,
                    'appointments'
                  )}
                </>
              )}
            </section>
          </>
        )}

        {/* AVAILABILITY TAB (DOCTOR ONLY) */}
        {activeTab === "availability" && user.role === "DOCTOR" && (
          <>
            <section className="card">
              <div className="display">
                <h2><FaCalendarPlus /> Mes Disponibilités</h2>
                <button 
                  className="btn-primary ajoter-creneau-btn"
                  onClick={() => setShowAddSlot(true)}
                >
                  + Ajouter un créneau
                </button>
              </div>

              {/* Add Slot Form */}
              {showAddSlot && (
                <div className="add-slot-form">
                  <h3>Ajouter un nouveau créneau</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date</label>
                      <input 
                        type="date" 
                        value={newSlot.date}
                        onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Heure de début</label>
                      <input 
                        type="time" 
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Heure de fin</label>
                      <input 
                        type="time" 
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn-success" onClick={handleAddSlot}>
                      Enregistrer
                    </button>
                    <button className="btn-secondary" onClick={() => setShowAddSlot(false)}>
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Availability List */}
              {availability.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune disponibilité programmée</p>
                  <p className="text-muted">Ajoutez vos premiers créneaux de disponibilité</p>
                </div>
              ) : (
                <>
                  <div className="availability-list">
                    {getPaginatedAvailability().map(slot => {
                      const slotDate = getSlotDate(slot);
                      const slotStartTime = getSlotStartTime(slot);
                      const slotEndTime = getSlotEndTime(slot);
                      
                      return (
                        <div key={slot._id} className="availability-card">
                          <div className="slot-info">
                            <FaCalendarAlt />
                            <div>
                              <h4>{formatDate(slotDate)}</h4>
                              <p>
                                <FaClock /> {formatTime(slotStartTime)} - {formatTime(slotEndTime)}
                              </p>
                              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                              </small>
                            </div>
                          </div>
                          <button 
                            className="btn-danger btn-sm"
                            onClick={() => handleDeleteSlot(slot._id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination pour les disponibilités */}
                  {renderPagination(
                    availabilityPage, 
                    getTotalPages(availability, availabilityPerPage), 
                    handleAvailabilityPageChange,
                    'availability'
                  )}
                </>
              )}
            </section>
          </>
        )}

        {/* PATIENT DOSSIER (if not in appointments tab) */}
        {activeTab !== "appointments" && user.role === "PATIENT" && (
          <section className="card">
            <h2>Dossier médical</h2>
            <div className="medical-box">
              <p>🩺 Groupe sanguin : O+</p>
              <p>⚠️ Allergies : Aucune</p>
              <p>📄 Ordonnances : 3 fichiers</p>
            </div>
          </section>
        )}

        {/* REVIEWS TAB - AVIS REÇUS SUR MOI */}
        {activeTab === "reviews" && (
          <section className="card">
            <h2>
              ⭐ Avis sur moi
              <span className="badge">{user.reviewsCount || receivedReviews.length}</span>
            </h2>
            
            {reviewsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Chargement des avis...</p>
              </div>
            ) : reviewsError ? (
              <div className="error-state">
                <p>{reviewsError}</p>
                <button 
                  className="btn-primary" 
                  onClick={fetchReceivedReviews}
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <>
                {/* Statistiques et note moyenne */}
                <div className="rating-overview">
                  <div className="average-rating">
                    <h3>Note moyenne</h3>
                    <div className="rating-score">
                      {renderStars(user.rating || 0)}
                    </div>
                    <p>Basé sur {receivedReviews.length} avis</p>
                  </div>
                  
                
                </div>
                
                {/* Liste des avis reçus SUR MOI */}
                <div className="received-reviews">
                  <div className="section-header">
                    <h4>Avis reçus sur moi ({receivedReviews.length})</h4>
                  </div>
                  
                  {receivedReviews.length === 0 ? (
                    <div className="empty-state">
                      <p>Aucun avis reçu sur vous pour le moment</p>
                      <p className="text-muted">
                        Les patients/clients pourront vous laisser un avis après leurs rendez-vous
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="reviews-list">
                        {receivedReviews
                          .slice((receivedReviewsPage - 1) * reviewsPerPage, receivedReviewsPage * reviewsPerPage)
                          .map((review, index) => (
                          <div key={review._id || index} className="review-card">
                            <div className="review-header">
                              <div className="reviewer-info">
                                <strong>{review.reviewerName || review.reviewerId?.fullName || "Anonyme"}</strong>
                                <div className="review-rating">
                                  {renderStars(review.rating || 0)}
                                </div>
                              </div>
                              <span className="review-date">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                            <p className="review-comment">{review.comment || "Pas de commentaire"}</p>
                            
                            {/* Réponse existante du professionnel */}
                            {review.response && (
                              <div className="review-response">
                                <div className="response-header">
                                  <strong>Votre réponse</strong>
                                </div>
                                <p className="response-text">{review.response.text || review.response.responseText}</p>
                              </div>
                            )}
                            
                            {/* Formulaire de réponse (si pas de réponse existante) */}
                            {!review.response && respondingTo === review._id ? (
                              <div className="response-form">
                                <textarea
                                  value={responseTexts[review._id] || ""}
                                  onChange={(e) => setResponseTexts(prev => ({
                                    ...prev,
                                    [review._id]: e.target.value
                                  }))}
                                  placeholder="Écrivez votre réponse ici..."
                                  rows={3}
                                  className="response-textarea"
                                />
                                <div className="response-form-actions">
                                  <button 
                                    className="btn-sm btn-success"
                                    onClick={() => handleSubmitResponse(review._id)}
                                    disabled={responseLoading[review._id]}
                                  >
                                    {responseLoading[review._id] ? "Envoi..." : "Envoyer la réponse"}
                                  </button>
                                  <button 
                                    className="btn-sm btn-secondary"
                                    onClick={() => cancelResponse(review._id)}
                                    disabled={responseLoading[review._id]}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            ) : !review.response && user.role !== "PATIENT" && (
                              // Seuls les professionnels peuvent répondre
                              <div className="response-actions">
                                <button 
                                  className="btn-sm btn-outline"
                                  onClick={() => startResponse(review._id)}
                                >
                                  Répondre à cet avis
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination pour les avis reçus */}
                      {Math.ceil(receivedReviews.length / reviewsPerPage) > 1 && (
                        <div className="reviews-pagination">
                          <div className="pagination-info">
                            Page {receivedReviewsPage} sur {Math.ceil(receivedReviews.length / reviewsPerPage)}
                          </div>
                          <div className="pagination-controls">
                            <button
                              className="pagination-btn"
                              onClick={() => setReceivedReviewsPage(prev => Math.max(1, prev - 1))}
                              disabled={receivedReviewsPage === 1}
                            >
                              <FaArrowLeft /> Précédent
                            </button>
                            <div className="pagination-numbers">
                              {[...Array(Math.ceil(receivedReviews.length / reviewsPerPage))].map((_, i) => (
                                <button
                                  key={i + 1}
                                  className={`pagination-page ${receivedReviewsPage === i + 1 ? 'active' : ''}`}
                                  onClick={() => setReceivedReviewsPage(i + 1)}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>
                            <button
                              className="pagination-btn"
                              onClick={() => setReceivedReviewsPage(prev => 
                                Math.min(Math.ceil(receivedReviews.length / reviewsPerPage), prev + 1)
                              )}
                              disabled={receivedReviewsPage === Math.ceil(receivedReviews.length / reviewsPerPage)}
                            >
                              Suivant <FaArrowRight />
                            </button>
                          </div>
                          <div className="per-page-selector">
                            <label>Afficher : </label>
                            <select
                              value={reviewsPerPage}
                              onChange={(e) => {
                                setReviewsPerPage(Number(e.target.value));
                                setReceivedReviewsPage(1);
                              }}
                            >
                              <option value={5}>5</option>
                              <option value={10}>10</option>
                              <option value={15}>15</option>
                              <option value={20}>20</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>
      
      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ Désactiver votre compte</h3>
            <p className="warning-text">
              Êtes-vous sûr de vouloir désactiver votre compte ?
            </p>
            <ul className="warning-list">
              <li>Vous ne serez plus visible dans la liste des médecins</li>
              <li>Les patients ne pourront plus prendre de rendez-vous avec vous</li>
              <li>Vous pourrez réactiver votre compte à tout moment</li>
            </ul>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeactivateModal(false)}
                disabled={deactivating}
              >
                Annuler
              </button>
              <button 
                className="btn-danger"
                onClick={handleDeactivateAccount}
                disabled={deactivating}
              >
                {deactivating ? "Désactivation..." : "Confirmer la désactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile