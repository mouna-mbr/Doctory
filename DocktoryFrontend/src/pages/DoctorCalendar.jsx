// DoctorCalendar.jsx
import { useState, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  FaClock,
  FaUser,
  FaInfoCircle,
  FaCalendarAlt,
  FaTimesCircle,
  FaCheckCircle
} from "react-icons/fa";
import "../assets/css/MyAppointments.css";

// Configurer moment en français
import 'moment/locale/fr';
moment.locale('fr');

const localizer = momentLocalizer(moment);

const DoctorCalendar = ({ appointments }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);

  // Formater les événements pour le calendrier
  const events = appointments.map(appointment => {
    const patientInfo = appointment.patientId || {};
    const patientName = patientInfo.fullName || patientInfo.name || "Patient";
    
    return {
      id: appointment._id,
      title: `${patientName} - ${appointment.reason || "Consultation"}`,
      start: new Date(appointment.startDateTime),
      end: new Date(appointment.endDateTime),
      allDay: false,
      resource: {
        appointment,
        patientName,
        status: appointment.status,
        reason: appointment.reason,
        notes: appointment.notes
      }
    };
  });

  // Style des événements selon le statut
  const eventStyleGetter = (event) => {
    let backgroundColor = "";
    
    switch (event.resource.status) {
      case "REQUESTED":
        backgroundColor = "#f39c12"; // Orange
        break;
      case "CONFIRMED":
        backgroundColor = "#27ae60"; // Vert
        break;
      case "CANCELLED":
        backgroundColor = "#e74c3c"; // Rouge
        break;
      case "COMPLETED":
        backgroundColor = "#3498db"; // Bleu
        break;
      default:
        backgroundColor = "#95a5a6"; // Gris
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "none",
        display: "block"
      }
    };
  };

  // Gérer la sélection d'un événement
  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event.resource);
  }, []);

  // Gérer la navigation
  const handleNavigate = useCallback((newDate) => {
    setCurrentDate(newDate);
  }, []);

  // Gérer le changement de vue
  const handleViewChange = useCallback((newView) => {
    setCurrentView(newView);
  }, []);

  // Gérer les actions de navigation
  const handlePrevClick = useCallback(() => {
    const newDate = moment(currentDate).subtract(1, currentView === Views.MONTH ? 'month' : 'week').toDate();
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const handleNextClick = useCallback(() => {
    const newDate = moment(currentDate).add(1, currentView === Views.MONTH ? 'month' : 'week').toDate();
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  const handleTodayClick = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

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

  // Obtenir l'icône de statut
  const getStatusIcon = (status) => {
    switch (status) {
      case "REQUESTED":
        return <FaClock />;
      case "CONFIRMED":
        return <FaCheckCircle />;
      case "CANCELLED":
        return <FaTimesCircle />;
      case "COMPLETED":
        return <FaCalendarAlt />;
      default:
        return <FaInfoCircle />;
    }
  };

  // Obtenir la couleur de statut
  const getStatusColor = (status) => {
    switch (status) {
      case "REQUESTED":
        return { color: "#f39c12", bg: "#fef5e6" };
      case "CONFIRMED":
        return { color: "#27ae60", bg: "#eafaf1" };
      case "CANCELLED":
        return { color: "#e74c3c", bg: "#fdedec" };
      case "COMPLETED":
        return { color: "#3498db", bg: "#eaf2f8" };
      default:
        return { color: "#7f8c8d", bg: "#f4f6f6" };
    }
  };

  // Texte du statut
  const getStatusText = (status) => {
    switch (status) {
      case "REQUESTED":
        return "Demandé";
      case "CONFIRMED":
        return "Confirmé";
      case "CANCELLED":
        return "Annulé";
      case "COMPLETED":
        return "Terminé";
      default:
        return status;
    }
  };

  // Composant Toolbar personnalisé
  const CustomToolbar = ({ label }) => {
    return (
      <div className="custom-toolbar">
        <div className="toolbar-navigation">
          <button onClick={handlePrevClick} className="nav-btn">
            ◀ Précédent
          </button>
          <button onClick={handleTodayClick} className="nav-btn today">
            Aujourd'hui
          </button>
          <button onClick={handleNextClick} className="nav-btn">
            Suivant ▶
          </button>
        </div>
        
        <div className="toolbar-label">
          <h3>{label}</h3>
        </div>
        
        <div className="toolbar-views">
          <button 
            onClick={() => handleViewChange(Views.MONTH)} 
            className={`view-btn ${currentView === Views.MONTH ? 'active' : ''}`}
          >
            Mois
          </button>
          <button 
            onClick={() => handleViewChange(Views.WEEK)} 
            className={`view-btn ${currentView === Views.WEEK ? 'active' : ''}`}
          >
            Semaine
          </button>
          <button 
            onClick={() => handleViewChange(Views.DAY)} 
            className={`view-btn ${currentView === Views.DAY ? 'active' : ''}`}
          >
            Jour
          </button>
          <button 
            onClick={() => handleViewChange(Views.AGENDA)} 
            className={`view-btn ${currentView === Views.AGENDA ? 'active' : ''}`}
          >
            Agenda
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="doctor-calendar-container">
      <div className="calendar-header">
        <h3><FaCalendarAlt /> Calendrier des Rendez-vous</h3>
        <p>Cliquez sur un rendez-vous pour voir les détails</p>
      </div>
      
      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={currentView}
          onView={handleViewChange}
          onNavigate={handleNavigate}
          style={{ height: 500 }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          messages={{
            today: "Aujourd'hui",
            previous: "Précédent",
            next: "Suivant",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            agenda: "Agenda",
            date: "Date",
            time: "Heure",
            event: "Événement",
            noEventsInRange: "Aucun rendez-vous dans cette période",
            showMore: total => `+ Voir ${total} de plus`,
          }}
          culture="fr"
          formats={{
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }) => {
              return `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`;
            },
            dayFormat: 'dddd DD',
            dayRangeHeaderFormat: ({ start, end }) => {
              return `${moment(start).format('DD MMM')} - ${moment(end).format('DD MMM')}`;
            },
            monthHeaderFormat: 'MMMM YYYY',
            dayHeaderFormat: 'dddd DD MMM',
            agendaHeaderFormat: ({ start, end }) => {
              return `${moment(start).format('DD MMM')} - ${moment(end).format('DD MMM')}`;
            },
          }}
          components={{
            toolbar: CustomToolbar
          }}
          popup
          showMultiDayTimes
        />
      </div>

      {/* Détails de l'événement sélectionné */}
      {selectedEvent && (
        <div className="event-details">
          <h4><FaInfoCircle /> Détails du rendez-vous</h4>
          <div className="event-info">
            <div className="info-item">
              <FaUser />
              <span><strong>Patient :</strong> {selectedEvent.patientName}</span>
            </div>
            
            <div className="info-item">
              <FaCalendarAlt />
              <span>
                <strong>Date :</strong> {formatDate(selectedEvent.appointment.startDateTime)}
              </span>
            </div>
            
            <div className="info-item">
              <FaClock />
              <span>
                <strong>Horaire :</strong> {formatTime(selectedEvent.appointment.startDateTime)} - {formatTime(selectedEvent.appointment.endDateTime)}
              </span>
            </div>
            
            <div className="info-item">
              <div 
                className="status-badge"
                style={{ 
                  color: getStatusColor(selectedEvent.status).color,
                  backgroundColor: getStatusColor(selectedEvent.status).bg
                }}
              >
                {getStatusIcon(selectedEvent.status)}
                <strong>Statut :</strong> {getStatusText(selectedEvent.status)}
              </div>
            </div>
            
            {selectedEvent.reason && (
              <div className="info-item">
                <FaInfoCircle />
                <span><strong>Raison :</strong> {selectedEvent.reason}</span>
              </div>
            )}
            
            {selectedEvent.notes && (
              <div className="info-item">
                <FaInfoCircle />
                <span><strong>Notes :</strong> {selectedEvent.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="calendar-legend">
        <h4>Légende :</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#f39c12" }}></span>
            <span>Demandé</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#27ae60" }}></span>
            <span>Confirmé</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#3498db" }}></span>
            <span>Terminé</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "#e74c3c" }}></span>
            <span>Annulé</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCalendar;