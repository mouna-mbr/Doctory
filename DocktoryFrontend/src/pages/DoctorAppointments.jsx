import { useEffect, useState } from "react";
import "../assets/css/DoctorAppointments.css";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetch("/api/appointments/doctor")
      .then(res => res.json())
      .then(data => setAppointments(data));
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`/api/appointments/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setAppointments(prev =>
      prev.map(a => (a._id === id ? { ...a, status } : a))
    );
  };

  return (
    <div className="doctor-appointments">
      <h2>📋 Rendez-vous patients</h2>

      <div className="appointments-list">
        {appointments.map((a) => (
          <div className="appointment-card" key={a._id}>
            <div>
              <h4>{a.patientId.fullName}</h4>
              <p>
                {new Date(a.startDateTime).toLocaleString()}
              </p>
              <span className={`status ${a.status.toLowerCase()}`}>
                {a.status}
              </span>
            </div>

            {a.status === "REQUESTED" && (
              <div className="actions">
                <button
                  className="accept"
                  onClick={() => updateStatus(a._id, "CONFIRMED")}
                >
                  Accepter
                </button>
                <button
                  className="reject"
                  onClick={() => updateStatus(a._id, "CANCELLED")}
                >
                  Refuser
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorAppointments;
