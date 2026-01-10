import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaUser, FaStethoscope, FaInfoCircle, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import "../assets/css/Appointment.css";

const AppointmentBooking = ({ doctorId: propDoctorId, doctorName: propDoctorName, doctorSpecialty: propDoctorSpecialty, onBack }) => {
  // Récupérer les paramètres de l'URL si disponibles
  const { doctorId: urlDoctorId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Utiliser les props d'abord, sinon les valeurs de l'URL
  const doctorId = propDoctorId || urlDoctorId;
  const doctorName = propDoctorName || searchParams.get('doctor') || "Dr. Inconnu";
  const doctorSpecialty = propDoctorSpecialty || searchParams.get('specialty') || "Généraliste";
  
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const API_BASE_URL = "http://localhost:5000/api";

  // Fonction pour combiner date et heure
  const combineDateAndTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return new Date();
    
    // S'assurer que le format de l'heure est correct (ajouter :00 si nécessaire)
    let time = timeStr;
    if (timeStr.length === 4) {
      // Format "0955" -> "09:55"
      time = timeStr.substring(0, 2) + ':' + timeStr.substring(2);
    } else if (timeStr.length === 5 && !timeStr.includes(':')) {
      // Format "0955" avec 5 caractères? impossible
      time = timeStr;
    }
    
    // S'assurer que l'heure a des secondes
    if (time.split(':').length === 2) {
      time = time + ':00';
    }
    
    // Combiner date et heure
    const dateTimeStr = `${dateStr}T${time}`;
    const date = new Date(dateTimeStr);
    
    // Si la date est invalide, essayer avec un format différent
    if (isNaN(date.getTime())) {
      // Essayer avec espace au lieu de T
      const dateTimeStr2 = `${dateStr} ${time}`;
      const date2 = new Date(dateTimeStr2);
      
      if (isNaN(date2.getTime())) {
        console.error("Invalid date after combining:", dateStr, timeStr, dateTimeStr);
        return new Date();
      }
      return date2;
    }
    
    return date;
  };

  // Fonction pour parser les dates des créneaux
  const parseSlotDate = (slot, selectedDate) => {
    try {
      // Si le slot a déjà une date complète, l'utiliser
      if (slot.startTime && typeof slot.startTime === 'string' && slot.startTime.includes('T')) {
        return {
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
        };
      }
      
      // Sinon, combiner la date sélectionnée avec l'heure du slot
      const startTime = combineDateAndTime(selectedDate, slot.startTime);
      const endTime = combineDateAndTime(selectedDate, slot.endTime);
      
      return { startTime, endTime };
    } catch (error) {
      console.error("Error parsing slot date:", error, slot);
      return {
        startTime: new Date(),
        endTime: new Date(),
      };
    }
  };

  // Fonction pour formater l'heure
  const formatTime = (date) => {
    try {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", date, error);
      return "Heure invalide";
    }
  };

  // Fonction pour formater la date complète
  const formatFullDate = (date) => {
    try {
      return date.toLocaleDateString("fr-FR", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting full date:", date, error);
      return "Date invalide";
    }
  };

  // Fonction pour calculer la durée
  const calculateDuration = (startTime, endTime) => {
    try {
      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
      return isNaN(durationMinutes) ? "Durée invalide" : `${durationMinutes} min`;
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "Durée invalide";
    }
  };

  // Fonction pour générer les 7 prochains jours
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  // Fonction pour formater la date en français
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Date invalide";
    }
  };

  // Debug: afficher les informations reçues
  useEffect(() => {
    console.log("🎯 AppointmentBooking Props:");
    console.log("  doctorId:", doctorId);
    console.log("  doctorName:", doctorName);
    console.log("  doctorSpecialty:", doctorSpecialty);
  }, [doctorId, doctorName, doctorSpecialty]);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    
    if (!token) {
      setError("Veuillez vous connecter pour prendre rendez-vous");
      setLoading(false);
      return;
    }
  }, []);

  // Récupérer les créneaux
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        setSlots([]);
        setSelectedSlot(null);

        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Veuillez vous connecter pour prendre rendez-vous");
          setLoading(false);
          return;
        }

        if (!doctorId) {
          setError("ID du médecin manquant");
          setLoading(false);
          return;
        }

        const url = `${API_BASE_URL}/availability/doctor/${doctorId}/slots?date=${selectedDate}`;
        console.log("📡 Fetching slots from:", url);

        const response = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        console.log("📊 Response status:", response.status);

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expirée. Veuillez vous reconnecter.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setTimeout(() => {
              window.location.href = "/signin";
            }, 2000);
            setLoading(false);
            return;
          }
          
          if (response.status === 404) {
            setSlots([]);
            setLoading(false);
            setInitialLoad(false);
            return;
          }
          
          throw new Error(`Erreur ${response.status} lors du chargement des créneaux`);
        }

        const data = await response.json();
        console.log("📦 Response data:", data);
        
        if (data.success) {
          // Formater les slots avec les dates complètes
          const formattedSlots = (data.data || []).map(slot => {
            console.log("Slot raw data:", slot);
            console.log("startTime:", slot.startTime, "Type:", typeof slot.startTime);
            console.log("endTime:", slot.endTime, "Type:", typeof slot.endTime);
            
            // Créer un slot avec les dates parsées
            const parsedDates = parseSlotDate(slot, selectedDate);
            return {
              ...slot,
              parsedStartTime: parsedDates.startTime,
              parsedEndTime: parsedDates.endTime,
              displayStartTime: formatTime(parsedDates.startTime),
              displayEndTime: formatTime(parsedDates.endTime),
              displayDuration: calculateDuration(parsedDates.startTime, parsedDates.endTime)
            };
          });
          
          setSlots(formattedSlots);
        } else {
          if (data.message && data.message !== "Aucun créneau disponible") {
            setError(data.message);
          }
          setSlots([]);
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
        if (err.message.includes("Failed to fetch") || err.message.includes("Network")) {
          setError("Erreur de connexion au serveur");
        }
        setSlots([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    if (doctorId && selectedDate && isAuthenticated) {
      fetchSlots();
    } else if (!isAuthenticated) {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [doctorId, selectedDate, isAuthenticated]);

  // Fonction pour se connecter
  const handleLogin = () => {
    window.location.href = `/signin?redirect=/appointment/${doctorId}?doctor=${encodeURIComponent(doctorName)}`;
  };

  // Fonction pour prendre rendez-vous
  const bookAppointment = async () => {
    if (!selectedSlot) return;

    try {
      setBookingLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("Veuillez vous connecter pour prendre rendez-vous");
        window.location.href = "/signin";
        return;
      }

      if (!reason.trim()) {
        setError("Veuillez indiquer la raison de la consultation");
        setBookingLoading(false);
        return;
      }

      // Préparer les données pour l'API
      const appointmentData = {
        doctorId,
        reason: reason.trim(),
        notes: notes.trim() || "",
        status: "pending"
      };

      // Si le slot a des dates parsées, les utiliser
      if (selectedSlot.parsedStartTime && selectedSlot.parsedEndTime) {
        appointmentData.startDateTime = selectedSlot.parsedStartTime.toISOString();
        appointmentData.endDateTime = selectedSlot.parsedEndTime.toISOString();
      } else {
        // Sinon, essayer de construire les dates
        const parsedDates = parseSlotDate(selectedSlot, selectedDate);
        appointmentData.startDateTime = parsedDates.startTime.toISOString();
        appointmentData.endDateTime = parsedDates.endTime.toISOString();
      }

      console.log("📤 Booking appointment with data:", appointmentData);

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          window.location.href = "/my-appointments";
        }, 3000);
      } else {
        throw new Error(data.message || "Erreur lors de la prise de rendez-vous");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // Gestion de la date
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlot(null);
  };

  // Afficher l'interface de connexion si non authentifié
  if (!isAuthenticated) {
    return (
      <div className="appointment-container auth-required">
        <div className="auth-message">
          <FaExclamationTriangle size={48} />
          <h3>Connexion requise</h3>
          <p>Veuillez vous connecter pour prendre un rendez-vous avec {doctorName}</p>
          <div className="auth-actions">
            <button className="login-btn" onClick={handleLogin}>
              Se connecter
            </button>
            <button className="back-btn" onClick={() => window.location.href = "/doctors"}>
              <FaArrowLeft /> Retour aux médecins
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="appointment-container loading">
        <div className="spinner"></div>
        <p>Chargement des créneaux disponibles...</p>
        <p className="loading-details">
          Médecin: {doctorName} | Date: {new Date(selectedDate).toLocaleDateString('fr-FR')}
        </p>
      </div>
    );
  }

  if (error && !initialLoad) {
    return (
      <div className="appointment-container error">
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
              <FaArrowLeft /> Retour aux médecins
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-container">
      {/* En-tête avec bouton retour */}
      <div className="appointment-header">
        <button 
          className="back-btn"
          onClick={onBack || (() => window.location.href = "/doctors")}
          disabled={bookingLoading || bookingSuccess}
        >
          <FaArrowLeft /> Retour aux médecins
        </button>
        
        <div className="doctor-header-info">
          <FaStethoscope className="doctor-icon" />
          <div>
            <h2>Prendre un rendez-vous</h2>
            <p className="doctor-info">
              avec <strong>{doctorName}</strong>
              {doctorSpecialty && doctorSpecialty !== "Généraliste" && <span> - {doctorSpecialty}</span>}
            </p>
          </div>
        </div>
      </div>

      {bookingSuccess && (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <div>
            <h3>Rendez-vous demandé avec succès !</h3>
            <p>Le docteur doit confirmer votre rendez-vous. Vous serez notifié par email.</p>
            <p className="redirect-info">Redirection vers vos rendez-vous dans 3 secondes...</p>
          </div>
        </div>
      )}

      {error && !bookingSuccess && (
        <div className="error-message">
          <FaInfoCircle /> {error}
          {error.includes("connecter") && (
            <button 
              className="login-btn" 
              onClick={() => window.location.href = "/signin"}
            >
              Se connecter
            </button>
          )}
        </div>
      )}

      {/* Sélection de la date */}
      {!bookingSuccess && (
        <div className="date-selection">
          <h3><FaCalendarAlt /> Choisir une date</h3>
          <div className="date-options">
            {getNextDays().map(date => (
              <button
                key={date}
                className={`date-option ${selectedDate === date ? 'active' : ''}`}
                onClick={() => setSelectedDate(date)}
                disabled={bookingLoading}
              >
                <div className="date-day">{formatDate(date).split(' ')[0]}</div>
                <div className="date-number">{new Date(date).getDate()}</div>
                <div className="date-month">{formatDate(date).split(' ')[2]}</div>
              </button>
            ))}
          </div>
          <div className="date-input">
            <label htmlFor="date-picker">Ou choisir une date spécifique :</label>
            <input
              type="date"
              id="date-picker"
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              max={getNextDays()[6]}
              disabled={bookingLoading}
            />
          </div>
        </div>
      )}

      {/* Formulaire d'information */}
      {!bookingSuccess && (
        <div className="appointment-form">
          <h3><FaUser /> Informations de consultation</h3>
          
          <div className="form-group">
            <label htmlFor="reason">
              Raison de la consultation *
            </label>
            <input
              type="text"
              id="reason"
              placeholder="Ex: Consultation de routine, Douleur spécifique, Suivi médical..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={bookingLoading}
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
              disabled={bookingLoading}
            />
          </div>
        </div>
      )}

      {/* Sélection de créneau */}
      {!bookingSuccess && slots.length > 0 && (
        <div className="slots-section">
          <h3>
            <FaClock /> Créneaux disponibles pour le {formatDate(selectedDate)}
          </h3>
          
          <div className="slot-grid">
            {slots.map((slot, index) => (
              <div
                key={slot._id || index}
                className={`slot-card ${
                  selectedSlot?._id === slot._id ? "active" : ""
                }`}
                onClick={() => !bookingLoading && setSelectedSlot(slot)}
              >
                <div className="slot-time">
                  <FaClock />
                  <span className="time">
                    {slot.displayStartTime || formatTime(slot.parsedStartTime)}
                  </span>
                  <span className="time-separator">-</span>
                  <span className="time">
                    {slot.displayEndTime || formatTime(slot.parsedEndTime)}
                  </span>
                </div>
                <div className="slot-duration">
                  <span className="duration">
                    {slot.displayDuration || calculateDuration(slot.parsedStartTime, slot.parsedEndTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message quand il n'y a pas de créneaux (sans erreur) */}
      {!bookingSuccess && slots.length === 0 && !loading && !error && (
        <div className="no-slots">
          <FaCalendarAlt size={48} />
          <h3>Aucun créneau disponible</h3>
          <p>Il n'y a pas de créneau disponible pour le {formatDate(selectedDate)}.</p>
          <p className="text-muted">Veuillez essayer une autre date ou contacter le docteur.</p>
          <div className="no-slots-actions">
            <button 
              className="btn-primary" 
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow.toISOString().split('T')[0]);
              }}
            >
              Essayer demain
            </button>
          </div>
        </div>
      )}

      {!bookingSuccess && selectedSlot && (
        <div className="selected-slot-info">
          <h4>Créneau sélectionné :</h4>
          <div className="slot-details">
            <div className="detail-item">
              <FaCalendarAlt />
              <span><strong>Date :</strong> {formatFullDate(selectedSlot.parsedStartTime)}</span>
            </div>
            <div className="detail-item">
              <FaClock />
              <span><strong>Horaire :</strong> {selectedSlot.displayStartTime} - {selectedSlot.displayEndTime}</span>
            </div>
            <div className="detail-item">
              <FaUser />
              <span><strong>Raison :</strong> {reason || "Non spécifiée"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      {!bookingSuccess && (
        <div className="booking-actions">
          <button
            className={`book-btn ${!selectedSlot || !reason.trim() || bookingLoading ? "disabled" : ""}`}
            disabled={!selectedSlot || !reason.trim() || bookingLoading}
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
      )}

      {/* Informations */}
      {!bookingSuccess && (
        <div className="appointment-info">
          <div className="info-item">
            <FaInfoCircle />
            <small>* Champs obligatoires</small>
          </div>
          <div className="info-item">
            <FaInfoCircle />
            <small>⚠️ Le rendez-vous sera confirmé après validation par le médecin</small>
          </div>
          <div className="info-item">
            <FaInfoCircle />
            <small>📧 Vous recevrez une confirmation par email</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;