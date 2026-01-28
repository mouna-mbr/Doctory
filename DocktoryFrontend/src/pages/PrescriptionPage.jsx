// pages/PrescriptionPage.jsx
import React, { useState, useEffect } from "react";
import {
  FaFileMedical,
  FaPills,
  FaUserMd,
  FaCalendarAlt,
  FaDownload,
  FaPrint,
  FaShare,
  FaQrcode,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import Swal from "sweetalert2";

const PrescriptionPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      
      const response = await fetch(
        `http://localhost:5000/api/patients/${user.userId}/prescriptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPrescriptions(data.data);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPrescription = async (prescriptionId) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `http://localhost:5000/api/prescriptions/${prescriptionId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ordonnance-${prescriptionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading prescription:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de télécharger l'ordonnance",
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Chargement des ordonnances...</p>
      </div>
    );
  }

  return (
    <div className="prescription-page">
      <div className="page-header">
        <h1>
          <FaFileMedical /> Mes Ordonnances
        </h1>
        <p>Consultez et gérez vos ordonnances médicales</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="no-prescriptions">
          <FaFileMedical size={64} />
          <h3>Aucune ordonnance</h3>
          <p>Vous n'avez pas encore d'ordonnance médicale.</p>
        </div>
      ) : (
        <div className="prescriptions-list">
          {prescriptions.map((prescription) => (
            <div key={prescription._id} className="prescription-card">
              <div className="prescription-header">
                <div className="prescription-info">
                  <h4>
                    <FaUserMd /> Dr. {prescription.doctorId?.fullName}
                  </h4>
                  <p className="specialty">
                    {prescription.doctorId?.specialty}
                  </p>
                  <p className="date">
                    <FaCalendarAlt /> {formatDate(prescription.createdAt)}
                  </p>
                </div>
                
                <div className="prescription-status">
                  <span className={`status-badge ${prescription.status.toLowerCase()}`}>
                    {prescription.status === "SIGNED" ? (
                      <>
                        <FaCheckCircle /> Signée
                      </>
                    ) : prescription.status === "DRAFT" ? (
                      <>
                        <FaClock /> Brouillon
                      </>
                    ) : (
                      <>
                        <FaExclamationTriangle /> Expirée
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="prescription-body">
                {prescription.diagnosis && (
                  <div className="diagnosis-section">
                    <h5>Diagnostic</h5>
                    <p>{prescription.diagnosis}</p>
                  </div>
                )}

                {prescription.medications && prescription.medications.length > 0 && (
                  <div className="medications-section">
                    <h5>
                      <FaPills /> Médicaments ({prescription.medications.length})
                    </h5>
                    <div className="medications-list">
                      {prescription.medications.map((med, index) => (
                        <div key={index} className="medication-item">
                          <div className="med-name">{med.name}</div>
                          <div className="med-details">
                            {med.dosage} - {med.frequency} - {med.duration}
                          </div>
                          {med.instructions && (
                            <div className="med-instructions">
                              <small>{med.instructions}</small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {prescription.medicalAdvice && (
                  <div className="advice-section">
                    <h5>Conseils médicaux</h5>
                    <p>{prescription.medicalAdvice}</p>
                  </div>
                )}
              </div>

              <div className="prescription-actions">
                {prescription.status === "SIGNED" && (
                  <>
                    <button
                      className="btn-primary"
                      onClick={() => downloadPrescription(prescription._id)}
                    >
                      <FaDownload /> Télécharger PDF
                    </button>
                    
                    <button
                      className="btn-secondary"
                      onClick={() => window.print()}
                    >
                      <FaPrint /> Imprimer
                    </button>
                    
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        Swal.fire({
                          title: "QR Code de vérification",
                          html: `<div style="text-align: center;">
                            <p>Scanner pour vérifier l'authenticité</p>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                              JSON.stringify({
                                prescriptionId: prescription._id,
                                patient: prescription.patientId?.fullName,
                                doctor: prescription.doctorId?.fullName,
                              })
                            )}" alt="QR Code" />
                          </div>`,
                        });
                      }}
                    >
                      <FaQrcode /> Voir QR Code
                    </button>
                  </>
                )}
              </div>
              
              {prescription.expiresAt && (
                <div className="prescription-footer">
                  <small>
                    <FaExclamationTriangle /> Valable jusqu'au{" "}
                    {formatDate(prescription.expiresAt)}
                  </small>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrescriptionPage;