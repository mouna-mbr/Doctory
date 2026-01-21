import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaUserMd,
  FaMapMarkerAlt,
  FaStethoscope,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaCalendarTimes,
  FaExternalLinkAlt,
  FaNotesMedical,
  FaUsers,
  FaCalendarDay
} from "react-icons/fa";
import Swal from "sweetalert2";
import "../assets/css/MyAppointments.css";

// Import du composant calendrier pour les médecins
import DoctorCalendar from "./DoctorCalendar";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [doctorView, setDoctorView] = useState("calendar"); // "calendar" ou "list"

  const API_BASE_URL = "http://localhost:5000/api";

  // Récupérer le rôle de l'utilisateur
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("User from localStorage:", user);
        // Vérifier les deux formats possibles (majuscule/minuscule)
        const role = user.role || user.Role || "";
        setUserRole(role);
        
        // Vérifier si c'est un médecin (gérer les deux cas de rôle)
        const isDoctorUser = role === "DOCTOR" || role === "doctor" || role === "médecin";
        setIsDoctor(isDoctorUser);
        console.log("User role detected:", role, "isDoctor:", isDoctorUser);
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  // Fonction pour tester la connexion API
  const testApiConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/appointments/test`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await response.json();
      console.log("API Test response:", data);
      
      if (response.ok) {
        console.log("✅ API test successful!");
        console.log("User data from backend:", data.user);
      } else {
        console.log("❌ API test failed:", data);
      }
    } catch (error) {
      console.error("Test API error:", error);
    }
  };

  // Récupérer les rendez-vous
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Veuillez vous connecter pour voir vos rendez-vous");
          setLoading(false);
          return;
        }

        console.log("Fetching appointments with token...");
        
        // D'abord tester la connexion API
        await testApiConnection();

        // Utiliser simplement /appointments
        const response = await fetch(`${API_BASE_URL}/appointments`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        console.log("API Response status:", response.status);
        
        if (!response.ok) {
          // Essayer de récupérer le message d'erreur détaillé
          let errorMessage = `Erreur ${response.status} lors du chargement des rendez-vous`;
          
          try {
            const errorData = await response.json();
            console.log("Error data from backend:", errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.log("Could not parse error response");
          }
          
          if (response.status === 401) {
            setError("Session expirée. Veuillez vous reconnecter.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setTimeout(() => {
              window.location.href = "/signin";
            }, 2000);
            return;
          } else if (response.status === 400) {
            setError(`Erreur de requête: ${errorMessage}. Veuillez vérifier votre configuration.`);
          } else {
            setError(errorMessage);
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Appointments data received:", data);
        
        if (data.success) {
          // Trier par date (du plus récent au plus ancien)
          const appointmentsData = data.data || [];
          console.log("Appointments count:", appointmentsData.length);
          
          const sortedAppointments = appointmentsData.sort((a, b) => {
            return new Date(b.startDateTime) - new Date(a.startDateTime);
          });
          
          setAppointments(sortedAppointments);
          console.log("Appointments loaded successfully:", sortedAppointments);
        } else {
          throw new Error(data.message || "Erreur inconnue du serveur");
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err.message || "Une erreur est survenue lors du chargement des rendez-vous");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []); // Retirer isDoctor de la dépendance pour éviter les appels multiples

  // Filtrer les rendez-vous (pour la vue liste)
  const filteredAppointments = appointments.filter(appointment => {
    const now = new Date();
    const appointmentDate = new Date(appointment.startDateTime);
    
    switch (filter) {
      case "upcoming":
        return appointmentDate > now && appointment.status !== "CANCELLED";
      case "past":
        return appointmentDate < now;
      case "REQUESTED":
        return appointment.status === "REQUESTED";
      case "CONFIRMED":
        return appointment.status === "CONFIRMED";
      case "CANCELLED":
        return appointment.status === "CANCELLED";
      case "COMPLETED":
        return appointment.status === "COMPLETED";
      default:
        return true;
    }
  });

  // Formater la date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  // Formater l'heure
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "Heure invalide";
    }
  };

  // Calculer la durée
  const calculateDuration = (start, end) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));
      return `${durationMinutes} min`;
    } catch (error) {
      return "Durée invalide";
    }
  };

  // Obtenir le statut avec icône
  const getStatusInfo = (status) => {
    switch (status) {
      case "REQUESTED":
        return {
          text: "Demandé",
          icon: <FaHourglassHalf />,
          color: "#f39c12",
          bgColor: "#fef5e6"
        };
      case "CONFIRMED":
        return {
          text: "Confirmé",
          icon: <FaCheckCircle />,
          color: "#27ae60",
          bgColor: "#eafaf1"
        };
      case "CANCELLED":
        return {
          text: "Annulé",
          icon: <FaTimesCircle />,
          color: "#e74c3c",
          bgColor: "#fdedec"
        };
      case "COMPLETED":
        return {
          text: "Terminé",
          icon: <FaCalendarCheck />,
          color: "#3498db",
          bgColor: "#eaf2f8"
        };
      default:
        return {
          text: status || "Inconnu",
          icon: <FaInfoCircle />,
          color: "#7f8c8d",
          bgColor: "#f4f6f6"
        };
    }
  };

  // Fonction pour consulter le profil
  const viewProfile = (userId) => {
      window.location.href = `/profile/${userId}`;
  };

  // Annuler un rendez-vous
  const handleCancelAppointment = async (appointmentId) => {
    try {
      setCancelling(true);
      
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour la liste des rendez-vous
        setAppointments(prev => prev.map(app => 
          app._id === appointmentId ? { ...app, status: "CANCELLED" } : app
        ));
        setShowCancelModal(false);
        setSelectedAppointment(null);
        
        // Afficher un message de succès
        Swal.fire({
          icon: 'success',
          title: 'Rendez-vous annulé',
          text: 'Le rendez-vous a été annulé avec succès.',
          confirmButtonColor: '#27ae60',
          timer: 3000
        });
      } else {
        throw new Error(data.message || "Erreur lors de l'annulation");
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de l'annulation: ${err.message}`,
        confirmButtonColor: '#e74c3c'
      });
    } finally {
      setCancelling(false);
    }
  };

  // Confirmer un rendez-vous (pour médecin)
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/confirm`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour la liste des rendez-vous
        setAppointments(prev => prev.map(app => 
          app._id === appointmentId ? { ...app, status: "CONFIRMED" } : app
        ));
        Swal.fire({
          icon: 'success',
          title: 'Rendez-vous confirmé',
          text: 'Le rendez-vous a été confirmé avec succès.',
          confirmButtonColor: '#27ae60',
          timer: 3000
        });
      } else {
        throw new Error(data.message || "Erreur lors de la confirmation");
      }
    } catch (err) {
      console.error("Error confirming appointment:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de la confirmation: ${err.message}`,
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  // Marquer comme terminé (pour médecin)
  const handleCompleteAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/complete`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour la liste des rendez-vous
        setAppointments(prev => prev.map(app => 
          app._id === appointmentId ? { ...app, status: "COMPLETED" } : app
        ));
        Swal.fire({
          icon: 'success',
          title: 'Rendez-vous terminé',
          text: 'Le rendez-vous a été marqué comme terminé.',
          confirmButtonColor: '#3498db',
          timer: 3000
        });
      } else {
        throw new Error(data.message || "Erreur lors de la complétion");
      }
    } catch (err) {
      console.error("Error completing appointment:", err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de la complétion: ${err.message}`,
        confirmButtonColor: '#e74c3c'
      });
    }
  };

  // Ouvrir la modal d'annulation
  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  // Vérifier si un rendez-vous peut être annulé
  const canCancelAppointment = (appointment) => {
    try {
      const appointmentDate = new Date(appointment.startDateTime);
      const now = new Date();
      const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);
      
      return appointment.status === "REQUESTED" || 
             (appointment.status === "CONFIRMED" && hoursDifference > 24);
    } catch (error) {
      return false;
    }
  };

  // Obtenir les statistiques
  const getStats = () => {
    const now = new Date();
    return {
      total: appointments.length,
      upcoming: appointments.filter(a => {
        try {
          return new Date(a.startDateTime) > now && a.status !== "CANCELLED";
        } catch {
          return false;
        }
      }).length,
      requested: appointments.filter(a => a.status === "REQUESTED").length,
      confirmed: appointments.filter(a => a.status === "CONFIRMED").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
      completed: appointments.filter(a => a.status === "COMPLETED").length
    };
  };

  // Déterminer si l'utilisateur est un médecin (pour l'affichage)
  const checkIsDoctor = () => {
    return userRole === "DOCTOR" || userRole === "doctor" || isDoctor;
  };

  if (loading) {
    return (
      <div className="my-appointments-container loading">
        <div className="spinner"></div>
        <p>Chargement de vos rendez-vous...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-appointments-container error">
        <div className="error-content">
          <FaExclamationTriangle size={48} />
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="btn-primary" 
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
            {!checkIsDoctor() && (
              <button 
                className="btn-secondary"
                onClick={() => window.location.href = "/doctors"}
              >
                Prendre un rendez-vous
              </button>
            )}
            <button 
              className="btn-secondary"
              onClick={testApiConnection}
            >
              Tester la connexion API
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si c'est un médecin, afficher l'interface médecin
  if (checkIsDoctor()) {
    const stats = getStats();

    return (
      <div className="my-appointments-container">
        <div className="appointments-header">
          <h1>
            <FaCalendarAlt /> Mes Rendez-vous - Médecin
          </h1>
          <p className="subtitle">
            Gérez votre calendrier de consultations
          </p>
        </div>

        {/* Boutons de vue pour médecin */}
        <div className="doctor-view-switcher">
          <button 
            className={`view-switch-btn ${doctorView === "calendar" ? "active" : ""}`}
            onClick={() => setDoctorView("calendar")}
          >
            <FaCalendarDay /> Calendrier
          </button>
          <button 
            className={`view-switch-btn ${doctorView === "list" ? "active" : ""}`}
            onClick={() => setDoctorView("list")}
          >
            <FaUsers /> Liste
          </button>
        </div>

        {/* Statistiques pour médecin */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FaCalendarAlt />
            </div>
            <div className="stat-info">
              <h3>Total</h3>
              <p className="stat-number">{stats.total}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon upcoming">
              <FaClock />
            </div>
            <div className="stat-info">
              <h3>À venir</h3>
              <p className="stat-number">{stats.upcoming}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon requested">
              <FaHourglassHalf />
            </div>
            <div className="stat-info">
              <h3>Demandés</h3>
              <p className="stat-number">{stats.requested}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon confirmed">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <h3>Confirmés</h3>
              <p className="stat-number">{stats.confirmed}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon completed">
              <FaCalendarCheck />
            </div>
            <div className="stat-info">
              <h3>Terminés</h3>
              <p className="stat-number">{stats.completed}</p>
            </div>
          </div>
        </div>

        {/* Affichage selon la vue sélectionnée */}
        {doctorView === "calendar" ? (
          <DoctorCalendar appointments={appointments} />
        ) : (
          // Vue liste pour médecin
          <>
            <div className="filters-section-myappointments">
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  Tous
                </button>
                <button 
                  className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
                  onClick={() => setFilter("upcoming")}
                >
                  À venir
                </button>
                <button 
                  className={`filter-btn ${filter === "REQUESTED" ? "active" : ""}`}
                  onClick={() => setFilter("REQUESTED")}
                >
                  Demandés
                </button>
                <button 
                  className={`filter-btn ${filter === "CONFIRMED" ? "active" : ""}`}
                  onClick={() => setFilter("CONFIRMED")}
                >
                  Confirmés
                </button>
                <button 
                  className={`filter-btn ${filter === "COMPLETED" ? "active" : ""}`}
                  onClick={() => setFilter("COMPLETED")}
                >
                  Terminés
                </button>
              </div>
              
              <div className="filter-info">
                <span className="filter-count">
                  {filteredAppointments.length} rendez-vous
                </span>
                {filter !== "all" && (
                  <button 
                    className="clear-filter"
                    onClick={() => setFilter("all")}
                  >
                    Effacer le filtre
                  </button>
                )}
              </div>
            </div>

            {/* Liste des rendez-vous pour médecin */}
            {filteredAppointments.length === 0 ? (
              <div className="no-appointments">
                <FaCalendarAlt size={64} />
                <h3>Aucun rendez-vous trouvé</h3>
                <p>
                  {appointments.length === 0 
                    ? "Vous n'avez pas encore de rendez-vous."
                    : `Aucun rendez-vous ne correspond au filtre "${filter}".`}
                </p>
              </div>
            ) : (
              <div className="appointments-list">
                {filteredAppointments.map((appointment) => {
                  const statusInfo = getStatusInfo(appointment.status);
                  const isUpcoming = new Date(appointment.startDateTime) > new Date();
                  
                  // Récupérer les informations du patient
                  const patientInfo = appointment.patientId || {};
                  const patientName = patientInfo.fullName || patientInfo.name || patientInfo.username || "Patient";
                  
                  return (
                    <div 
                      key={appointment._id} 
                      className={`appointment-card ${appointment.status} ${isUpcoming ? 'upcoming' : 'past'}`}
                    >
                      <div className="appointment-header">
                        <div className="appointment-date">
                          <FaCalendarAlt />
                          <span>{formatDate(appointment.startDateTime)}</span>
                        </div>
                        <div className="appointment-status" style={{ 
                          color: statusInfo.color,
                          backgroundColor: statusInfo.bgColor
                        }}>
                          {statusInfo.icon}
                          <span>{statusInfo.text}</span>
                        </div>
                      </div>
                      
                      <div className="appointment-body">
                        <div className="appointment-info">
                          <div className="info-row">
                            <div className="info-item">
                              <FaClock />
                              <span>
                                <strong>Horaire :</strong> {formatTime(appointment.startDateTime)} - {formatTime(appointment.endDateTime)}
                                <span className="duration"> ({calculateDuration(appointment.startDateTime, appointment.endDateTime)})</span>
                              </span>
                            </div>
                            
                            <div className="info-item">
                              <FaUsers />
                              <div className="patient-details">
                                <span><strong>Patient :</strong> {patientName}</span>
                                <button 
                                  className="view-profile-btn"  
                                  onClick={() => viewProfile(patientInfo._id)}
                                >
                                  <FaExternalLinkAlt /> Voir profil 
                                </button>
                              </div>
                            </div>
                            
                            {appointment.reason && (
                              <div className="info-item">
                                <FaNotesMedical />
                                <span>
                                  <strong>Raison :</strong> {appointment.reason}
                                </span>
                              </div>
                            )}
                            
                            {appointment.notes && (
                              <div className="info-item">
                                <FaInfoCircle />
                                <span>
                                  <strong>Notes :</strong> {appointment.notes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="appointment-actions">
                          {appointment.status === "REQUESTED" && isUpcoming && (
                            <div className="doctor-actions">
                              <button 
                                className="confirm-btn"
                                onClick={() => handleConfirmAppointment(appointment._id)}
                              >
                                <FaCheckCircle /> Confirmer
                              </button>
                              <button 
                                className="cancel-btn"
                                onClick={() => openCancelModal(appointment)}
                              >
                                <FaTimesCircle /> Refuser
                              </button>
                            </div>
                          )}
                          
                          {appointment.status === "CONFIRMED" && isUpcoming  && (
                            <>
                            <button
                              className="join-btn"
                              onClick={() => window.location.href = `/video/${appointment.videoRoomId}`}
                            >
                              <FaExternalLinkAlt /> Rejoindre la consultation
                            </button>

                            <button 
                              className="complete-btn"
                              onClick={() => handleCompleteAppointment(appointment._id)}
                            >
                              <FaCalendarCheck /> Marquer comme terminé
                            </button>
                            </>
                          )}
                          
                          {appointment.status === "COMPLETED" && (
                            <div className="completed-info">
                              <FaCheckCircle />
                              <span>Consultation terminée</span>
                            </div>
                          )}
                          
                          {appointment.status === "CANCELLED" && (
                            <div className="cancelled-info">
                              <FaTimesCircle />
                              <span>Rendez-vous annulé</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {appointment.createdAt && (
                        <div className="appointment-footer">
                          <small>
                            Rendez-vous créé le {formatDate(appointment.createdAt)} à {formatTime(appointment.createdAt)}
                          </small>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Si c'est un patient, afficher l'interface patient
  const stats = getStats();

  return (
    <div className="my-appointments-container">
      <div className="appointments-header">
        <h1>
          <FaCalendarAlt /> Mes Rendez-vous
        </h1>
        <p className="subtitle">
          Gérez vos rendez-vous médicaux
        </p>
      </div>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FaCalendarAlt />
          </div>
          <div className="stat-info">
            <h3>Total</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon upcoming">
            <FaClock />
          </div>
          <div className="stat-info">
            <h3>À venir</h3>
            <p className="stat-number">{stats.upcoming}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon requested">
            <FaHourglassHalf />
          </div>
          <div className="stat-info">
            <h3>Demandés</h3>
            <p className="stat-number">{stats.requested}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon confirmed">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <h3>Confirmés</h3>
            <p className="stat-number">{stats.confirmed}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <FaCalendarCheck />
          </div>
          <div className="stat-info">
            <h3>Terminés</h3>
            <p className="stat-number">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section-myappointments">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tous
          </button>
          <button 
            className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            À venir
          </button>
          <button 
            className={`filter-btn ${filter === "REQUESTED" ? "active" : ""}`}
            onClick={() => setFilter("REQUESTED")}
          >
            Demandés
          </button>
          <button 
            className={`filter-btn ${filter === "CONFIRMED" ? "active" : ""}`}
            onClick={() => setFilter("CONFIRMED")}
          >
            Confirmés
          </button>
          <button 
            className={`filter-btn ${filter === "CANCELLED" ? "active" : ""}`}
            onClick={() => setFilter("CANCELLED")}
          >
            Annulés
          </button>
          <button 
            className={`filter-btn ${filter === "COMPLETED" ? "active" : ""}`}
            onClick={() => setFilter("COMPLETED")}
          >
            Terminés
          </button>
        </div>
        
        <div className="filter-info">
          <span className="filter-count">
            {filteredAppointments.length} rendez-vous
          </span>
          {filter !== "all" && (
            <button 
              className="clear-filter"
              onClick={() => setFilter("all")}
            >
              Effacer le filtre
            </button>
          )}
        </div>
      </div>

      {/* Liste des rendez-vous */}
      {filteredAppointments.length === 0 ? (
        <div className="no-appointments">
          <FaCalendarAlt size={64} />
          <h3>Aucun rendez-vous trouvé</h3>
          <p>
            {appointments.length === 0 
              ? "Vous n'avez pas encore de rendez-vous."
              : `Aucun rendez-vous ne correspond au filtre "${filter}".`}
          </p>
          {appointments.length === 0 && (
            <button 
              className="btn-primary"
              onClick={() => window.location.href = "/doctors"}
            >
              Prendre un rendez-vous
            </button>
          )}
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map((appointment) => {
            const statusInfo = getStatusInfo(appointment.status);
            const isUpcoming = new Date(appointment.startDateTime) > new Date();
            const canCancel = canCancelAppointment(appointment);
            
            // Récupérer les informations du médecin si disponibles
            const doctorInfo = appointment.doctorId || {};
            const doctorName = doctorInfo.fullName || doctorInfo.name || doctorInfo.username || "Médecin";
            const doctorSpecialty = doctorInfo.specialty || "Non spécifié";
            const doctorLocation = doctorInfo.location || doctorInfo.city || "Non spécifié";
            
            return (
              <div 
                key={appointment._id} 
                className={`appointment-card ${appointment.status} ${isUpcoming ? 'upcoming' : 'past'}`}
              >
                <div className="appointment-header">
                  <div className="appointment-date">
                    <FaCalendarAlt />
                    <span>{formatDate(appointment.startDateTime)}</span>
                  </div>
                  <div className="appointment-status" style={{ 
                    color: statusInfo.color,
                    backgroundColor: statusInfo.bgColor
                  }}>
                    {statusInfo.icon}
                    <span>{statusInfo.text}</span>
                  </div>
                </div>
                
                <div className="appointment-body">
                  <div className="appointment-info">
                    <div className="info-row">
                      <div className="info-item doctor-info">
                        <FaUserMd />
                        <div className="doctor-details">
                          <span><strong>Médecin :</strong> Dr. {doctorName} </span>
                          <a 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              viewProfile(appointment.doctorId?._id || appointment.doctorId, doctorName, "doctor");
                            }}
                          >
                            <FaExternalLinkAlt />
                          </a>
                        </div>
                      </div>
                      <div className="info-item">
                        <FaClock />
                        <span>
                          <strong>Horaire :</strong> {formatTime(appointment.startDateTime)} - {formatTime(appointment.endDateTime)}
                          <span className="duration"> ({calculateDuration(appointment.startDateTime, appointment.endDateTime)})</span>
                        </span>
                      </div>
                      
                      <div className="info-item">
                        <FaStethoscope />
                        <span>
                          <strong>Spécialité :</strong> {doctorSpecialty}
                        </span>
                      </div>
                      
                      {appointment.reason && (
                        <div className="info-item">
                          <FaNotesMedical />
                          <span>
                            <strong>Raison :</strong> {appointment.reason}
                          </span>
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div className="info-item">
                          <FaInfoCircle />
                          <span>
                            <strong>Notes :</strong> {appointment.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="appointment-actions">
                    {appointment.status === "REQUESTED" && isUpcoming && (
                      <div className="pending-info">
                        <FaInfoCircle />
                        <small>En attente de confirmation par le médecin</small>
                      </div>
                    )}
                    
                    {canCancel && isUpcoming && appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && (
                      <button 
                        className="cancel-btn"
                        onClick={() => openCancelModal(appointment)}
                        disabled={cancelling}
                      >
                        <FaCalendarTimes /> Annuler
                      </button>
                    )}
                    
                    {!isUpcoming && appointment.status === "COMPLETED" && (
                      <button 
                        className="review-btn"
                        onClick={() => window.location.href = `/appointment/${appointment._id}/review`}
                      >
                        Laisser un avis
                      </button>
                    )}
                    
                    {appointment.status === "CANCELLED" && (
                      <div className="cancelled-info">
                        <FaTimesCircle />
                        <span>Ce rendez-vous a été annulé</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {appointment.createdAt && (
                  <div className="appointment-footer">
                    <small>
                      Rendez-vous créé le {formatDate(appointment.createdAt)} à {formatTime(appointment.createdAt)}
                    </small>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bouton pour prendre un nouveau rendez-vous */}
      <div className="new-appointment-section">
        <button 
          className="new-appointment-btn"
          onClick={() => window.location.href = "/doctors"}
        >
          <FaCalendarAlt /> Prendre un nouveau rendez-vous
        </button>
      </div>

      {/* Modal d'annulation */}
      {showCancelModal && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Annuler le rendez-vous</h3>
            <p>
              Êtes-vous sûr de vouloir annuler votre rendez-vous 
              du {formatDate(selectedAppointment.startDateTime)} à {formatTime(selectedAppointment.startDateTime)} ?
            </p>
            
            <div className="modal-actions">
              <button 
                className="modal-cancel-btn"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Non, garder
              </button>
              <button 
                className="modal-confirm-btn"
                onClick={() => handleCancelAppointment(selectedAppointment._id)}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <span className="spinner-small"></span>
                    Annulation...
                  </>
                ) : (
                  <>
                    <FaTimesCircle /> Oui, annuler
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;