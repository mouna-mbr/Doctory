"use client"
import { useState, useEffect, useMemo } from "react"
import { FaCalendarAlt, FaClock, FaCalendarPlus, FaCalendarCheck, FaCalendarTimes, FaArrowLeft, FaArrowRight, FaStar, FaRegStar, FaStarHalfAlt, FaSort, FaSortUp, FaSortDown, FaFilter } from "react-icons/fa"
import Swal from "sweetalert2"
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
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [receivedReviewsPage, setReceivedReviewsPage] = useState(1);
  const [reviewsPerPage, setReviewsPerPage] = useState(5);

  // États pour les réponses aux avis
  const [responseTexts, setResponseTexts] = useState({});
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseLoading, setResponseLoading] = useState({});

  // États pour la pagination des rendez-vous
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [appointmentsPerPage, setAppointmentsPerPage] = useState(3);

  // États pour la pagination des disponibilités
  const [availabilityPage, setAvailabilityPage] = useState(1);
  const [availabilityPerPage, setAvailabilityPerPage] = useState(3);

  // États pour la gestion du compte
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // États pour les tris
  const [appointmentSort, setAppointmentSort] = useState("newest"); // "newest", "oldest"
  const [appointmentFilter, setAppointmentFilter] = useState("all"); // "all", "today", "past", "future"
  const [availabilitySort, setAvailabilitySort] = useState("newest"); // "newest", "oldest"
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // "all", "today", "past", "future"

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

  // Fonction pour obtenir la date d'un rendez-vous
  const getAppointmentDate = (appointment) => {
    return appointment.startDateTime || appointment.date || "";
  };

  // Fonction pour obtenir la date d'une disponibilité
  const getAvailabilityDate = (slot) => {
    return slot.date || slot.startDateTime || "";
  };

  // Fonction pour déterminer si une date est aujourd'hui
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Fonction pour déterminer si une date est dans le passé
  const isPast = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    
    // Pour les rendez-vous, on compare avec l'heure actuelle
    // Pour les disponibilités, on compare juste la date
    if (dateString.includes('T')) {
      // C'est une date/heure complète
      return date < now;
    } else {
      // C'est juste une date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const slotDate = new Date(dateString);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate < today;
    }
  };

  // Fonction pour déterminer si une date est dans le futur
  const isFuture = (dateString) => {
    if (!dateString) return false;
    return !isToday(dateString) && !isPast(dateString);
  };

  // Rendez-vous triés et filtrés
  const sortedAndFilteredAppointments = useMemo(() => {
    let filtered = [...appointments];
    
    // Appliquer le filtre
    if (appointmentFilter === "today") {
      filtered = filtered.filter(app => isToday(getAppointmentDate(app)));
    } else if (appointmentFilter === "past") {
      filtered = filtered.filter(app => isPast(getAppointmentDate(app)));
    } else if (appointmentFilter === "future") {
      filtered = filtered.filter(app => isFuture(getAppointmentDate(app)));
    }
    
    // Appliquer le tri
    filtered.sort((a, b) => {
      const dateA = new Date(getAppointmentDate(a) || 0);
      const dateB = new Date(getAppointmentDate(b) || 0);
      
      if (appointmentSort === "newest") {
        return dateB - dateA; // Le plus récent en premier
      } else {
        return dateA - dateB; // Le plus ancien en premier
      }
    });
    
    return filtered;
  }, [appointments, appointmentSort, appointmentFilter]);

  // Disponibilités triées et filtrées
  const sortedAndFilteredAvailability = useMemo(() => {
    let filtered = [...availability];
    
    // Appliquer le filtre
    if (availabilityFilter === "today") {
      filtered = filtered.filter(slot => isToday(getAvailabilityDate(slot)));
    } else if (availabilityFilter === "past") {
      filtered = filtered.filter(slot => isPast(getAvailabilityDate(slot)));
    } else if (availabilityFilter === "future") {
      filtered = filtered.filter(slot => isFuture(getAvailabilityDate(slot)));
    }
    
    // Appliquer le tri
    filtered.sort((a, b) => {
      const dateA = new Date(getAvailabilityDate(a) || 0);
      const dateB = new Date(getAvailabilityDate(b) || 0);
      
      if (availabilitySort === "newest") {
        return dateB - dateA; // Le plus récent en premier
      } else {
        return dateA - dateB; // Le plus ancien en premier
      }
    });
    
    return filtered;
  }, [availability, availabilitySort, availabilityFilter]);

  // Fonction pour récupérer les avis que les autres ont donnés SUR MOI (avis reçus)
  const fetchReceivedReviews = async () => {
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
          
          if (!targetId) return false;
          
          if (typeof targetId === 'object') {
            const isAboutMe = targetId._id === userId || targetId.id === userId;
            if (isAboutMe) {
              console.log(`Found review ABOUT ME: ${review.comment?.substring(0, 50)}...`);
            }
            return isAboutMe;
          }
          
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
          
          const averageRating = reviewsAboutMe.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewsAboutMe.length;
          setUser(prev => ({
            ...prev,
            rating: averageRating,
            reviewsCount: reviewsAboutMe.length
          }));
        } else {
          console.log("No reviews found ABOUT ME, trying alternative routes...");
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
            
            if (data.data.length > 0) {
              const averageRating = data.data.reduce((sum, review) => sum + (review.rating || 0), 0) / data.data.length;
              setUser(prev => ({
                ...prev,
                rating: averageRating,
                reviewsCount: data.data.length
              }));
            }
          } else if (data.data) {
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
      Swal.fire({
        icon: 'warning',
        title: 'Réponse vide',
        text: 'Veuillez écrire une réponse',
        confirmButtonColor: '#1B2688'
      });
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
        
        setRespondingTo(null);
        setResponseTexts(prev => ({ ...prev, [reviewId]: "" }));
        
        Swal.fire({
          icon: 'success',
          title: 'Réponse ajoutée!',
          text: 'Votre réponse a été publiée avec succès',
          confirmButtonColor: '#1B2688',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: data.message || 'Impossible d\'ajouter la réponse',
          confirmButtonColor: '#1B2688'
        });
      }
    } catch (err) {
      console.error("Error adding response:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'ajout de la réponse',
        confirmButtonColor: '#1B2688'
      });
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
      const appointmentsRes = await fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const appointmentsData = await appointmentsRes.json();
      if (appointmentsData.success) {
        setAppointments(appointmentsData.data || []);
      }

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
      Swal.fire({
        icon: 'warning',
        title: 'Champs requis',
        text: 'Veuillez remplir tous les champs',
        confirmButtonColor: '#1B2688'
      });
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
        Swal.fire({
          icon: 'success',
          title: 'Succès!',
          text: 'Créneau ajouté avec succès!',
          confirmButtonColor: '#1B2688',
          timer: 2000,
          showConfirmButton: false
        });
        setShowAddSlot(false);
        setNewSlot({ date: "", startTime: "", endTime: "" });
        
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
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: data.message || 'Erreur lors de l\'ajout du créneau',
          confirmButtonColor: '#1B2688'
        });
      }
    } catch (err) {
      console.error("Error adding slot:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'ajout du créneau',
        confirmButtonColor: '#1B2688'
      });
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const result = await Swal.fire({
      title: 'Supprimer ce créneau?',
      text: "Cette action est irréversible",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });
    
    if (!result.isConfirmed) return;
    
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
        Swal.fire({
          icon: 'success',
          title: 'Supprimé!',
          text: 'Créneau supprimé avec succès',
          confirmButtonColor: '#1B2688',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: data.message || 'Erreur lors de la suppression',
          confirmButtonColor: '#1B2688'
        });
      }
    } catch (err) {
      console.error("Error deleting slot:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la suppression du créneau',
        confirmButtonColor: '#1B2688'
      });
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
        Swal.fire({
          icon: 'success',
          title: 'Succès!',
          text: `Rendez-vous ${action === "confirm" ? "confirmé" : "annulé"} avec succès!`,
          confirmButtonColor: '#1B2688',
          timer: 2000,
          showConfirmButton: false
        });
        
        setAppointments(prev => prev.map(app => 
          app._id === appointmentId 
            ? { ...app, status: action === "confirm" ? "CONFIRMED" : "CANCELLED" }
            : app
        ));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: data.message || 'Une erreur s\'est produite',
          confirmButtonColor: '#1B2688'
        });
      }
    } catch (err) {
      console.error(`Error ${action} appointment:`, err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de ${action === "confirm" ? "la confirmation" : "l'annulation"} du rendez-vous`,
        confirmButtonColor: '#1B2688'
      });
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
      
      if (typeof timeString === 'string' && timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes || 0), 0);
        return date.toLocaleTimeString("fr-FR", {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
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
    return sortedAndFilteredAppointments.slice(startIndex, endIndex);
  };

  // Fonction pour calculer les disponibilités paginées
  const getPaginatedAvailability = () => {
    const startIndex = (availabilityPage - 1) * availabilityPerPage;
    const endIndex = startIndex + availabilityPerPage;
    return sortedAndFilteredAvailability.slice(startIndex, endIndex);
  };

  // Fonction pour calculer le nombre total de pages
  const getTotalPages = (items, perPage) => {
    return Math.ceil(items.length / perPage);
  };

  // Fonction pour changer de page (rendez-vous)
  const handleAppointmentsPageChange = (newPage) => {
    const totalPages = getTotalPages(sortedAndFilteredAppointments, appointmentsPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setAppointmentsPage(newPage);
    }
  };

  // Fonction pour changer de page (disponibilités)
  const handleAvailabilityPageChange = (newPage) => {
    const totalPages = getTotalPages(sortedAndFilteredAvailability, availabilityPerPage);
    if (newPage >= 1 && newPage <= totalPages) {
      setAvailabilityPage(newPage);
    }
  };

  // Fonction pour générer les boutons de pagination
  const renderPagination = (currentPage, totalPages, handlePageChange, itemsName, totalItems) => {
    if (totalPages <= 1) return null;

    const itemsPerPage = itemsName === 'appointments' ? appointmentsPerPage : availabilityPerPage;
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const pages = [];
    
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('...');
    }
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...');
    }
    
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          Affichage {startItem}-{endItem} sur {totalItems} {itemsName === 'appointments' ? 'rendez-vous' : 'créneaux'}
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

        <div className="per-page-selector">
          <label>Afficher : </label>
          <select
            value={itemsPerPage}
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
        Swal.fire({
          icon: 'success',
          title: 'Compte désactivé',
          text: 'Votre compte a été désactivé avec succès. Vous n\'apparaîtrez plus dans la liste des médecins.',
          confirmButtonColor: '#1B2688'
        });
        setShowDeactivateModal(false);
        
        setUser(prev => ({
          ...prev,
          isActive: false
        }));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: data.message || 'Impossible de désactiver le compte',
          confirmButtonColor: '#1B2688'
        });
      }
    } catch (err) {
      console.error("Error deactivating account:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la désactivation du compte',
        confirmButtonColor: '#1B2688'
      });
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
        Swal.fire({
          icon: 'success',
          title: 'Compte réactivé',
          text: 'Votre compte a été réactivé avec succès. Vous apparaîtrez à nouveau dans la liste des médecins.',
          confirmButtonColor: '#1B2688'
        });
        
        setUser(prev => ({
          ...prev,
          isActive: true
        }));
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: data.message || 'Impossible de réactiver le compte',
          confirmButtonColor: '#1B2688'
        });
      }
    } catch (err) {
      console.error("Error reactivating account:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la réactivation du compte',
        confirmButtonColor: '#1B2688'
      });
    } finally {
      setDeactivating(false);
    }
  };

  // Fonction pour charger les avis quand on clique sur l'onglet "Mes Avis"
  const handleReviewsTabClick = () => {
    setActiveTab("reviews");
    
    setTimeout(() => {
      if (user) {
        fetchReceivedReviews();
      }
    }, 100);
  };

  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (sortType, currentSort) => {
    if (sortType !== currentSort) {
      return <FaSort />;
    }
    return currentSort === "newest" ? <FaSortDown /> : <FaSortUp />;
  };

  // Fonction pour obtenir le label du filtre
  const getFilterLabel = (filterType) => {
    const labels = {
      "all": "Tous",
      "today": "Aujourd'hui",
      "past": "Passés",
      "future": "À venir"
    };
    return labels[filterType] || filterType;
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
                <span className="badge">{sortedAndFilteredAppointments.length}</span>
              </h2>
              
              {/* Filtres et tris pour les rendez-vous */}
              <div className="filter-sort-controls">
                <div className="filter-group">
                  <FaFilter className="filter-icon" />
                  <span className="filter-label">Filtrer par :</span>
                  <div className="filter-buttons">
                    <button 
                      className={`filter-btn ${appointmentFilter === "all" ? "active" : ""}`}
                      onClick={() => setAppointmentFilter("all")}
                    >
                      Tous ({appointments.length})
                    </button>
                    <button 
                      className={`filter-btn ${appointmentFilter === "today" ? "active" : ""}`}
                      onClick={() => setAppointmentFilter("today")}
                    >
                      Aujourd'hui ({appointments.filter(app => isToday(getAppointmentDate(app))).length})
                    </button>
                    <button 
                      className={`filter-btn ${appointmentFilter === "past" ? "active" : ""}`}
                      onClick={() => setAppointmentFilter("past")}
                    >
                      Passés ({appointments.filter(app => isPast(getAppointmentDate(app))).length})
                    </button>
                    <button 
                      className={`filter-btn ${appointmentFilter === "future" ? "active" : ""}`}
                      onClick={() => setAppointmentFilter("future")}
                    >
                      À venir ({appointments.filter(app => isFuture(getAppointmentDate(app))).length})
                    </button>
                  </div>
                </div>
                
                <div className="sort-group">
                  <span className="sort-label">Trier par :</span>
                  <div className="sort-buttons">
                    <button 
                      className={`sort-btn ${appointmentSort === "newest" ? "active" : ""}`}
                      onClick={() => setAppointmentSort("newest")}
                    >
                      {getSortIcon("newest", appointmentSort)} Plus récents
                    </button>
                    <button 
                      className={`sort-btn ${appointmentSort === "oldest" ? "active" : ""}`}
                      onClick={() => setAppointmentSort("oldest")}
                    >
                      {getSortIcon("oldest", appointmentSort)} Plus anciens
                    </button>
                  </div>
                </div>
              </div>
              
              {sortedAndFilteredAppointments.length === 0 ? (
                <div className="empty-state">
                  <FaCalendarAlt size={48} />
                  <p>Aucun rendez-vous {appointmentFilter !== "all" ? getFilterLabel(appointmentFilter).toLowerCase() : ""} trouvé</p>
                  {appointmentFilter !== "all" && (
                    <button 
                      className="btn-secondary" 
                      onClick={() => setAppointmentFilter("all")}
                    >
                      Voir tous les rendez-vous
                    </button>
                  )}
                  {user.role === "PATIENT" && appointmentFilter === "all" && (
                    <a href="/doctors" className="btn-primaryy">Prendre un rendez-vous</a>
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
                              <FaClock /> {formatDate(getAppointmentDate(appointment))} 
                              <br />
                              {formatTime(appointment.startDateTime)} - {formatTime(appointment.endDateTime)}
                            </p>
                            <div className="appointment-date-badge">
                              {isToday(getAppointmentDate(appointment)) ? (
                                <span className="badge badge-today">Aujourd'hui</span>
                              ) : isPast(getAppointmentDate(appointment)) ? (
                                <span className="badge badge-past">Passé</span>
                              ) : (
                                <span className="badge badge-future">À venir</span>
                              )}
                            </div>
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
                    getTotalPages(sortedAndFilteredAppointments, appointmentsPerPage), 
                    handleAppointmentsPageChange,
                    'appointments',
                    sortedAndFilteredAppointments.length
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
                  className="btn-primaryy ajoter-creneau-btn"
                  onClick={() => setShowAddSlot(true)}
                >
                  + Ajouter un créneau
                </button>
              </div>

              {/* Filtres et tris pour les disponibilités */}
              <div className="filter-sort-controls">
                <div className="filter-group">
                  <FaFilter className="filter-icon" />
                  <span className="filter-label">Filtrer par :</span>
                  <div className="filter-buttons">
                    <button 
                      className={`filter-btn ${availabilityFilter === "all" ? "active" : ""}`}
                      onClick={() => setAvailabilityFilter("all")}
                    >
                      Tous ({availability.length})
                    </button>
                    <button 
                      className={`filter-btn ${availabilityFilter === "today" ? "active" : ""}`}
                      onClick={() => setAvailabilityFilter("today")}
                    >
                      Aujourd'hui ({availability.filter(slot => isToday(getAvailabilityDate(slot))).length})
                    </button>
                    <button 
                      className={`filter-btn ${availabilityFilter === "past" ? "active" : ""}`}
                      onClick={() => setAvailabilityFilter("past")}
                    >
                      Passés ({availability.filter(slot => isPast(getAvailabilityDate(slot))).length})
                    </button>
                    <button 
                      className={`filter-btn ${availabilityFilter === "future" ? "active" : ""}`}
                      onClick={() => setAvailabilityFilter("future")}
                    >
                      À venir ({availability.filter(slot => isFuture(getAvailabilityDate(slot))).length})
                    </button>
                  </div>
                </div>
                
                <div className="sort-group">
                  <span className="sort-label">Trier par :</span>
                  <div className="sort-buttons">
                    <button 
                      className={`sort-btn ${availabilitySort === "newest" ? "active" : ""}`}
                      onClick={() => setAvailabilitySort("newest")}
                    >
                      {getSortIcon("newest", availabilitySort)} Plus récents
                    </button>
                    <button 
                      className={`sort-btn ${availabilitySort === "oldest" ? "active" : ""}`}
                      onClick={() => setAvailabilitySort("oldest")}
                    >
                      {getSortIcon("oldest", availabilitySort)} Plus anciens
                    </button>
                  </div>
                </div>
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
                        min={new Date().toISOString().split('T')[0]}
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
              {sortedAndFilteredAvailability.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune disponibilité {availabilityFilter !== "all" ? getFilterLabel(availabilityFilter).toLowerCase() : ""} trouvée</p>
                  <p className="text-muted">
                    {availabilityFilter === "all" 
                      ? "Ajoutez vos premiers créneaux de disponibilité"
                      : `Aucun créneau ${getFilterLabel(availabilityFilter).toLowerCase()} trouvé`}
                  </p>
                  {availabilityFilter !== "all" && (
                    <button 
                      className="btn-secondary" 
                      onClick={() => setAvailabilityFilter("all")}
                    >
                      Voir toutes les disponibilités
                    </button>
                  )}
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
                              <div className="slot-date-badge">
                                {isToday(slotDate) ? (
                                  <span className="badge badge-today">Aujourd'hui</span>
                                ) : isPast(slotDate) ? (
                                  <span className="badge badge-past">Passé</span>
                                ) : (
                                  <span className="badge badge-future">À venir</span>
                                )}
                              </div>
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
                    getTotalPages(sortedAndFilteredAvailability, availabilityPerPage), 
                    handleAvailabilityPageChange,
                    'availability',
                    sortedAndFilteredAvailability.length
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
                  className="btn-primaryy" 
                  onClick={fetchReceivedReviews}
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <>
                <div className="rating-overview">
                  <div className="average-rating">
                    <h3>Note moyenne</h3>
                    <div className="rating-score">
                      {renderStars(user.rating || 0)}
                    </div>
                    <p>Basé sur {receivedReviews.length} avis</p>
                  </div>
                </div>
                
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
                            
                            {review.response && (
                              <div className="review-response">
                                <div className="response-header">
                                  <strong>Votre réponse</strong>
                                </div>
                                <p className="response-text">{review.response.text || review.response.responseText}</p>
                              </div>
                            )}
                            
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