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
  FaNotesMedical
} from "react-icons/fa";
import "../assets/css/MyAppointments.css";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, upcoming, past, REQUESTED, CONFIRMED, CANCELLED, COMPLETED
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const API_BASE_URL = "http://localhost:5000/api";

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

        const response = await fetch(`${API_BASE_URL}/appointments`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expirée. Veuillez vous reconnecter.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setTimeout(() => {
              window.location.href = "/signin";
            }, 2000);
            return;
          }
          throw new Error(`Erreur ${response.status} lors du chargement des rendez-vous`);
        }

        const data = await response.json();
        
        if (data.success) {
          // Trier par date (du plus récent au plus ancien)
          const sortedAppointments = (data.data || []).sort((a, b) => {
            return new Date(b.startDateTime) - new Date(a.startDateTime);
          });
          setAppointments(sortedAppointments);
          console.log("Appointments loaded:", sortedAppointments);
        } else {
          throw new Error(data.message || "Erreur inconnue");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Filtrer les rendez-vous
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
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Formater l'heure
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Calculer la durée
  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));
    return `${durationMinutes} min`;
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
          text: "Inconnu",
          icon: <FaInfoCircle />,
          color: "#7f8c8d",
          bgColor: "#f4f6f6"
        };
    }
  };

  // Fonction pour consulter le profil du médecin
  const viewDoctorProfile = (doctorId, doctorName) => {
    window.location.href = `/doctor/${doctorId}?name=${encodeURIComponent(doctorName)}`;
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
      } else {
        throw new Error(data.message || "Erreur lors de l'annulation");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error cancelling appointment:", err);
    } finally {
      setCancelling(false);
    }
  };

  // Ouvrir la modal d'annulation
  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  // Vérifier si un rendez-vous peut être annulé
  const canCancelAppointment = (appointment) => {
    const appointmentDate = new Date(appointment.startDateTime);
    const now = new Date();
    const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);
    
    return appointment.status === "REQUESTED" || 
           (appointment.status === "CONFIRMED" && hoursDifference > 24);
  };

  // Obtenir les statistiques
  const getStats = () => {
    const now = new Date();
    return {
      total: appointments.length,
      upcoming: appointments.filter(a => new Date(a.startDateTime) > now && a.status !== "CANCELLED").length,
      requested: appointments.filter(a => a.status === "REQUESTED").length,
      confirmed: appointments.filter(a => a.status === "CONFIRMED").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
      completed: appointments.filter(a => a.status === "COMPLETED").length
    };
  };

  const stats = getStats();

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
            <button 
              className="btn-secondary"
              onClick={() => window.location.href = "/doctors"}
            >
              Prendre un rendez-vous
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            const doctorName = doctorInfo.fullName || doctorInfo.name || "Médecin";
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
                          <a 
                            
                            onClick={() => viewDoctorProfile(appointment.doctorId?._id || appointment.doctorId, doctorName)}
                          >
                          <span><strong>Médecin :</strong> Dr. {doctorName} </span>
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