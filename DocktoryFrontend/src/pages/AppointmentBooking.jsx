import { useEffect, useState } from "react";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
import "../assets/css/Appointment.css";

const AppointmentBooking = ({ doctorId }) => {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetch(`/api/availability/${doctorId}`)
      .then(res => res.json())
      .then(data => setSlots(data));
  }, [doctorId]);

  const bookAppointment = async () => {
    if (!selectedSlot) return;

    await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId,
        startDateTime: `${selectedSlot.date}T${selectedSlot.startTime}`,
        endDateTime: `${selectedSlot.date}T${selectedSlot.endTime}`,
      }),
    });

    alert("Rendez-vous demandé avec succès");
  };

  return (
    <div className="appointment-container">
      <h2>📅 Prendre un rendez-vous</h2>

      <div className="slot-grid">
        {slots.map((slot) => (
          <div
            key={slot._id}
            className={`slot-card ${
              selectedSlot?._id === slot._id ? "active" : ""
            }`}
            onClick={() => setSelectedSlot(slot)}
          >
            <FaCalendarAlt />
            <p>{new Date(slot.date).toLocaleDateString()}</p>
            <FaClock />
            <span>
              {slot.startTime} - {slot.endTime}
            </span>
          </div>
        ))}
      </div>

      <button
        className="book-btn"
        disabled={!selectedSlot}
        onClick={bookAppointment}
      >
        Confirmer le rendez-vous
      </button>
    </div>
  );
};

export default AppointmentBooking;
