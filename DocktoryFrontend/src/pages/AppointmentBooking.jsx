import { useEffect, useState } from "react";
import { FaCalendarAlt, FaClock, FaUser, FaStethoscope, FaInfoCircle } from "react-icons/fa";
import "../assets/css/Appointment.css";

const AppointmentBooking = ({ doctorId, doctorName, doctorSpecialty }) => {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // CORRECTION : URL avec /api/
  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Veuillez vous connecter pour prendre rendez-vous");
          setLoading(false);
          return;
        }

        // CORRECTION : URL avec /api/
        const response = await fetch(
          `${API_BASE_URL}/availability/doctor/${doctorId}/slots?date=${new Date().toISOString().split('T')[0]}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

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
          throw new Error(`Erreur ${response.status} lors du chargement des créneaux`);
        }

        const data = await response.json();
        if (data.success) {
          setSlots(data.data || []);
        } else {
          throw new Error(data.message || "Erreur inconnue");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchSlots();
    }
  }, [doctorId]);

  const bookAppointment = async () => {
    if (!selectedSlot) return;

    try {
      setBookingLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("Veuillez vous connecter pour prendre rendez-vous");
        window.location.href = "/signin";
        return;
      }

      // CORRECTION : URL avec /api/
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          doctorId,
          startDateTime: selectedSlot.startTime,
          endDateTime: selectedSlot.endTime,
          reason: reason.trim() || "Consultation générale",
          notes: notes.trim() || ""
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setBookingSuccess(true);
        setSelectedSlot(null);
        setReason("");
        setNotes("");
        
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error(data.message || "Erreur lors de la prise de rendez-vous");
      }
    } catch (err) {
      setError(err.message);
      alert("Erreur: " + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="appointment-container loading">
        <div className="spinner"></div>
        <p>Chargement des créneaux disponibles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="appointment-container error">
        <p className="error-message">
          <FaInfoCircle /> {error}
        </p>
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
    <div className="appointment-container">
      <div className="appointment-header">
        <FaStethoscope className="doctor-icon" />
        <div>
          <h2>Prendre un rendez-vous</h2>
          <p className="doctor-info">
            avec <strong>Dr. {doctorName}</strong>
            {doctorSpecialty && <span> - {doctorSpecialty}</span>}
          </p>
        </div>
      </div>

      {bookingSuccess && (
        <div className="success-message">
          ✅ Rendez-vous demandé avec succès ! 
          <br />
          Le docteur doit confirmer votre rendez-vous. Vous serez notifié par email.
        </div>
      )}

      {/* Formulaire d'information supplémentaire */}
      <div className="appointment-form">
        <div className="form-group">
          <label htmlFor="reason">
            <FaUser /> Raison de la consultation *
          </label>
          <input
            type="text"
            id="reason"
            placeholder="Ex: Consultation de routine, Douleur spécifique, Suivi médical..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes supplémentaires (optionnel)</label>
          <textarea
            id="notes"
            placeholder="Décrivez brièvement vos symptômes ou informations importantes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
          />
        </div>
      </div>

      {/* Sélection de créneau */}
      <div className="slots-section">
        <h3>
          <FaCalendarAlt /> Créneaux disponibles
        </h3>
        
        {slots.length === 0 ? (
          <div className="no-slots">
            <FaCalendarAlt size={48} />
            <p>Aucun créneau disponible pour aujourd'hui.</p>
            <p className="text-muted">Veuillez essayer une autre date ou contacter le docteur.</p>
            <button 
              className="btn-primary" 
              onClick={() => window.location.reload()}
            >
              Actualiser
            </button>
          </div>
        ) : (
          <>
            <div className="slot-grid">
              {slots.map((slot, index) => (
                <div
                  key={slot._id || index}
                  className={`slot-card ${
                    selectedSlot?.startTime === slot.startTime ? "active" : ""
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <div className="slot-time">
                    <FaClock />
                    <span className="time">
                      {new Date(slot.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="slot-date">
                    <FaCalendarAlt />
                    <span className="date">
                      {new Date(slot.startTime).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="slot-duration">
                    <span className="duration">
                      {Math.round((new Date(slot.endTime) - new Date(slot.startTime)) / (1000 * 60))} min
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedSlot && (
              <div className="selected-slot-info">
                <h4>Créneau sélectionné :</h4>
                <p>
                  📅 <strong>{new Date(selectedSlot.startTime).toLocaleDateString("fr-FR", {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</strong>
                  <br />
                  ⏰ <strong>{new Date(selectedSlot.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - {new Date(selectedSlot.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</strong>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bouton de confirmation */}
      <div className="booking-actions">
        <button
          className={`book-btn ${!selectedSlot ? "disabled" : ""}`}
          disabled={!selectedSlot || bookingLoading}
          onClick={bookAppointment}
        >
          {bookingLoading ? (
            <>
              <span className="spinner-small"></span>
              Traitement en cours...
            </>
          ) : (
            "Confirmer le rendez-vous"
          )}
        </button>
        
        {selectedSlot && (
          <button
            className="cancel-btn"
            onClick={() => setSelectedSlot(null)}
            disabled={bookingLoading}
          >
            Changer de créneau
          </button>
        )}
      </div>

      <div className="appointment-info">
        <p><small>* Champs obligatoires</small></p>
        <p><small>⚠️ Le rendez-vous sera confirmé après validation par le médecin</small></p>
      </div>
    </div>
  );
};

export default AppointmentBooking;