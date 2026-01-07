import { useState, useEffect } from "react";
import { FaUsers, FaUserMd, FaPills, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaExternalLinkAlt, FaTimes } from "react-icons/fa";
import "../../assets/css/Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalPharmacists: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingDoctors: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        const users = data.data;
        const doctors = users.filter(u => u.role === "DOCTOR");
        const pendingDocs = doctors.filter(d => !d.isActive);
        
        const stats = {
          totalUsers: users.length,
          totalDoctors: doctors.length,
          totalPatients: users.filter(u => u.role === "PATIENT").length,
          totalPharmacists: users.filter(u => u.role === "PHARMACIST").length,
          activeUsers: users.filter(u => u.isActive).length,
          inactiveUsers: users.filter(u => !u.isActive).length,
          pendingDoctors: pendingDocs.length
        };

        setStats(stats);
      } else {
        setError("Impossible de charger les statistiques");
      }
    } catch (err) {
      setError("Erreur lors du chargement des statistiques");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingDoctors = async () => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/users?role=DOCTOR&isActive=false", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setPendingDoctors(data.data);
      }
    } catch (err) {
      console.error("Fetch pending doctors error:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleReviewRequests = () => {
    setShowVerificationModal(true);
    fetchPendingDoctors();
  };

  const handleApprove = async (doctorId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir approuver ce docteur ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/users/${doctorId}/activate`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert("Docteur approuvé avec succès");
        fetchPendingDoctors();
        fetchDashboardStats();
      } else {
        alert("Erreur lors de l'approbation");
      }
    } catch (err) {
      alert("Erreur lors de l'approbation");
      console.error("Approve doctor error:", err);
    }
  };

  const handleReject = async (doctorId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir rejeter ce docteur ? Cette action supprimera le compte.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/users/${doctorId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert("Docteur rejeté et compte supprimé");
        fetchPendingDoctors();
        fetchDashboardStats();
      } else {
        alert("Erreur lors du rejet");
      }
    } catch (err) {
      alert("Erreur lors du rejet");
      console.error("Reject doctor error:", err);
    }
  };

  const kpiCards = [
    {
      id: 1,
      title: "Total Utilisateurs",
      value: stats.totalUsers,
      icon: <FaUsers />,
      color: "#1b2688",
      bgColor: "rgba(27, 38, 136, 0.1)"
    },
    {
      id: 2,
      title: "Docteurs",
      value: stats.totalDoctors,
      icon: <FaUserMd />,
      color: "#28a745",
      bgColor: "rgba(40, 167, 69, 0.1)"
    },
    {
      id: 3,
      title: "Patients",
      value: stats.totalPatients,
      icon: <FaUsers />,
      color: "#17a2b8",
      bgColor: "rgba(23, 162, 184, 0.1)"
    },
    {
      id: 4,
      title: "Pharmaciens",
      value: stats.totalPharmacists,
      icon: <FaPills />,
      color: "#ffc107",
      bgColor: "rgba(255, 193, 7, 0.1)"
    },
    {
      id: 5,
      title: "Utilisateurs Actifs",
      value: stats.activeUsers,
      icon: <FaCalendarAlt />,
      color: "#28a745",
      bgColor: "rgba(40, 167, 69, 0.1)"
    },
    {
      id: 6,
      title: "Utilisateurs Inactifs",
      value: stats.inactiveUsers,
      icon: <FaUsers />,
      color: "#dc3545",
      bgColor: "rgba(220, 53, 69, 0.1)"
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-message">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Tableau de Bord</h1>
        <p>Vue d'ensemble de votre plateforme Doctory</p>
      </div>

      <div className="kpi-grid">
        {kpiCards.map((card) => (
          <div 
            key={card.id} 
            className="kpi-card"
            style={{ borderLeft: `4px solid ${card.color}` }}
          >
            <div className="kpi-icon" style={{ backgroundColor: card.bgColor, color: card.color }}>
              {card.icon}
            </div>
            <div className="kpi-content">
              <h3 className="kpi-title">{card.title}</h3>
              <p className="kpi-value">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.pendingDoctors > 0 && (
        <div className="verification-card">
          <div className="verification-header">
            <div className="verification-icon">
              <FaUserMd />
            </div>
            <div className="verification-content">
              <h3>Docteurs en attente de vérification</h3>
              <p className="verification-count">{stats.pendingDoctors} demande(s) en attente</p>
            </div>
          </div>
          <button className="review-btn" onClick={handleReviewRequests}>
            Examiner les demandes
          </button>
        </div>
      )}

      

      {showVerificationModal && (
        <div className="modal-overlay" onClick={() => setShowVerificationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Vérification des Docteurs</h2>
              <button className="modal-close" onClick={() => setShowVerificationModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {modalLoading ? (
                <div className="modal-loading">Chargement...</div>
              ) : pendingDoctors.length === 0 ? (
                <div className="no-pending">Aucune demande en attente</div>
              ) : (
                <div className="doctors-list">
                  {pendingDoctors.map((doctor) => (
                    <div key={doctor._id} className="doctor-card">
                      <div className="doctor-info">
                        <h4>{doctor.fullName}</h4>
                        <div className="doctor-details">
                          <p><strong>Email:</strong> {doctor.email}</p>
                          <p><strong>Téléphone:</strong> {doctor.phoneNumber}</p>
                          <p><strong>Spécialité:</strong> {doctor.specialty || "Non spécifiée"}</p>
                          <p><strong>Années d'expérience:</strong> {doctor.yearsOfExperience || "Non spécifié"}</p>
                          <p><strong>Numéro de licence:</strong> {doctor.licenseNumber || "Non spécifié"}</p>
                          {doctor.licenseDocumentUrl && (
                            <p>
                              <strong>Document:</strong>{" "}
                              <a 
                                href={doctor.licenseDocumentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="document-link"
                              >
                                Voir le document <FaExternalLinkAlt />
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="doctor-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => handleApprove(doctor._id)}
                        >
                          <FaCheckCircle /> Approuver
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleReject(doctor._id)}
                        >
                          <FaTimesCircle /> Rejeter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
