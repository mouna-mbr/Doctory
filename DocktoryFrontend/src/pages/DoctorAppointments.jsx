import { useEffect, useState } from "react";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaUser, 
  FaCheck, 
  FaTimes, 
  FaInfoCircle,
  FaHistory,
  FaExclamationTriangle
} from "react-icons/fa";
import "../assets/css/DoctorAppointments.css";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("ALL"); // ALL, REQUESTED, CONFIRMED, COMPLETED, CANCELLED

  // CORRECTION : URL avec /api/
  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Veuillez vous connecter");
          setLoading(false);
          return;
        }

        // CORRECTION : URL avec /api/
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
          setAppointments(data.data || []);
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

  const updateStatus = async (id, status) => {
    if (!confirm(`Voulez-vous vraiment ${status === 'CONFIRMED' ? 'accepter' : 'refuser'} ce rendez-vous?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const action = status === 'CONFIRMED' ? 'confirm' : 'cancel';

      // CORRECTION : URL avec /api/
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/${action}`, {
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
        // Update the appointment in state
        setAppointments(prev =>
          prev.map(a => 
            a._id === id 
              ? { ...a, status: status }
              : a
          )
        );
        alert(`Rendez-vous ${status === 'CONFIRMED' ? 'accepté' : 'refusé'} avec succès!`);
      } else {
        alert("Erreur: " + data.message);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Erreur: " + err.message);
    }
  };

  const completeAppointment = async (id) => {
    if (!confirm("Marquer ce rendez-vous comme terminé?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // CORRECTION : URL avec /api/
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/complete`, {
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
        setAppointments(prev =>
          prev.map(a => 
            a._id === id 
              ? { ...a, status: "COMPLETED" }
              : a
          )
        );
        alert("Rendez-vous marqué comme terminé avec succès!");
      } else {
        alert("Erreur: " + data.message);
      }
    } catch (err) {
      console.error("Error completing appointment:", err);
      alert("Erreur: " + err.message);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString("fr-FR", {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    if (filter === "ALL") return true;
    return appointment.status === filter;
  });

  // Count appointments by status
  const statusCounts = {
    ALL: appointments.length,
    REQUESTED: appointments.filter(a => a.status === "REQUESTED").length,
    CONFIRMED: appointments.filter(a => a.status === "CONFIRMED").length,
    COMPLETED: appointments.filter(a => a.status === "COMPLETED").length,
    CANCELLED: appointments.filter(a => a.status === "CANCELLED").length,
  };

  if (loading) {
    return (
      <div className="doctor-appointments loading">
        <div className="spinner"></div>
        <p>Chargement des rendez-vous...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doctor-appointments error">
        <FaExclamationTriangle className="error-icon" />
        <h3>Erreur de chargement</h3>
        <p>{error}</p>
        <button 
          className="btn-primary" 
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="doctor-appointments">
      <div className="header">
        <h2>
          <FaCalendarAlt /> Rendez-vous patients
          <span className="badge">{appointments.length}</span>
        </h2>
        <div className="refresh-button">
          <button 
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="status-filters">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === "ALL" ? "Tous" : 
             status === "REQUESTED" ? "En attente" :
             status === "CONFIRMED" ? "Confirmés" :
             status === "COMPLETED" ? "Terminés" : "Annulés"}
            <span className="count-badge">{count}</span>
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="empty-state">
          <FaHistory size={48} />
          <p>Aucun rendez-vous {filter !== "ALL" ? `avec le statut "${filter}"` : ""} trouvé.</p>
          {filter !== "ALL" && (
            <button 
              className="btn-secondary"
              onClick={() => setFilter("ALL")}
            >
              Voir tous les rendez-vous
            </button>
          )}
        </div>
      ) : (
        <div className="appointments-list">
          {filteredAppointments.map((appointment) => (
            <div className="appointment-card" key={appointment._id || appointment.id}>
              <div className="appointment-header">
                <div className="patient-info">
                  <FaUser className="patient-icon" />
                  <div>
                    <h4>{appointment.patientId?.fullName || appointment.patientName || "Patient"}</h4>
                    <p className="patient-contact">
                      {appointment.patientId?.email || appointment.patientEmail || ""}
                      {appointment.patientId?.phoneNumber && ` • ${appointment.patientId.phoneNumber}`}
                    </p>
                  </div>
                </div>
                <span className={`status ${appointment.status?.toLowerCase() || 'unknown'}`}>
                  {appointment.status === "REQUESTED" ? "En attente" :
                   appointment.status === "CONFIRMED" ? "Confirmé" :
                   appointment.status === "COMPLETED" ? "Terminé" :
                   appointment.status === "CANCELLED" ? "Annulé" : "Inconnu"}
                </span>
              </div>

              <div className="appointment-details">
                <p className="appointment-time">
                  <FaCalendarAlt /> {formatDate(appointment.startDateTime || appointment.date)}
                </p>
                <p className="appointment-time">
                  <FaClock /> {formatTime(appointment.startDateTime || appointment.startTime)} - 
                  {formatTime(appointment.endDateTime || appointment.endTime)}
                </p>
                
                {appointment.reason && (
                  <div className="appointment-reason">
                    <FaInfoCircle />
                    <span><strong>Raison :</strong> {appointment.reason}</span>
                  </div>
                )}
                
                {appointment.notes && (
                  <div className="appointment-notes">
                    <FaInfoCircle />
                    <span><strong>Notes :</strong> {appointment.notes}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {appointment.status === "REQUESTED" && (
                <div className="actions">
                  <button
                    className="accept"
                    onClick={() => updateStatus(appointment._id || appointment.id, "CONFIRMED")}
                  >
                    <FaCheck /> Accepter
                  </button>
                  <button
                    className="reject"
                    onClick={() => updateStatus(appointment._id || appointment.id, "CANCELLED")}
                  >
                    <FaTimes /> Refuser
                  </button>
                </div>
              )}

              {appointment.status === "CONFIRMED" && (
                <div className="actions">
                  <button
                    className="complete"
                    onClick={() => completeAppointment(appointment._id || appointment.id)}
                  >
                    <FaCheck /> Marquer comme terminé
                  </button>
                  <button
                    className="cancel"
                    onClick={() => updateStatus(appointment._id || appointment.id, "CANCELLED")}
                  >
                    <FaTimes /> Annuler
                  </button>
                </div>
              )}

              {appointment.status === "COMPLETED" && (
                <div className="completed-info">
                  <span className="completed-text">
                    <FaCheck /> Rendez-vous terminé
                  </span>
                </div>
              )}

              {appointment.status === "CANCELLED" && (
                <div className="cancelled-info">
                  <span className="cancelled-text">
                    <FaTimes /> Rendez-vous annulé
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="appointments-summary">
        <p>
          <strong>Total :</strong> {appointments.length} rendez-vous • 
          <span className="requested"> {statusCounts.REQUESTED} en attente</span> • 
          <span className="confirmed"> {statusCounts.CONFIRMED} confirmés</span> • 
          <span className="completed"> {statusCounts.COMPLETED} terminés</span> • 
          <span className="cancelled"> {statusCounts.CANCELLED} annulés</span>
        </p>
      </div>
    </div>
  );
};

export default DoctorAppointments;