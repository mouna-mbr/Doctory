"use client"
import { useState, useEffect } from "react"
import { FaCalendarAlt, FaClock, FaCalendarPlus, FaCalendarCheck, FaCalendarTimes } from "react-icons/fa"
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
          setUser(data.data);
          
          if (data.data.role === "PATIENT") {
            await fetchPatientAppointments(token);
          } else if (data.data.role === "DOCTOR") {
            await fetchDoctorData(token, data.data._id || data.data.id);
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

  // Fonction pour formater la date CORRIGÉE
  const formatDate = (dateString) => {
    try {
      // Si c'est une date ISO complète (2026-01-10T00:00:00.000Z)
      if (dateString && dateString.includes('T')) {
        return new Date(dateString).toLocaleDateString("fr-FR", {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      // Si c'est juste une date (2026-01-10)
      else if (dateString) {
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("fr-FR", {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return dateString || "Date inconnue";
    } catch (err) {
      console.error("Error formatting date:", err, dateString);
      return "Date invalide";
    }
  };

  // Fonction pour formater l'heure CORRIGÉE
  const formatTime = (timeString) => {
    try {
      if (!timeString) return "Heure inconnue";
      
      // Si c'est un format HH:MM:SS ou HH:MM
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes || 0), 0);
        return date.toLocaleTimeString("fr-FR", {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      // Si c'est une date ISO
      else if (timeString.includes('T')) {
        return new Date(timeString).toLocaleTimeString("fr-FR", {
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

  // Fonction pour obtenir la date d'un slot (gère les deux formats)
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
        <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>

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
          
          <li>
            <a href="/dossier">📂 Dossiers</a>
          </li>
          {user.role !== "patient" && <li>⭐ Avis</li>}
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
                <div className="appointments-list">
                  {appointments.map(appointment => (
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
                <div className="availability-list">
                  {availability.map(slot => {
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

        {/* REVIEWS */}
        {activeTab !== "appointments" && user.role !== "PATIENT" && (
          <section className="card">
            <h2>Avis</h2>
            <div className="review">
              ⭐⭐⭐⭐⭐
              <p>Excellent service, très professionnel.</p>
            </div>
            <div className="review">
              ⭐⭐⭐⭐☆
              <p>Bonne expérience globale.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Profile