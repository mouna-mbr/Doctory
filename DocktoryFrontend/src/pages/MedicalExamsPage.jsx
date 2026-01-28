import React, { useState, useEffect } from "react";
import {
  FaFlask,
  FaUpload,
  FaFilePdf,
  FaUserMd,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import Swal from "sweetalert2";

const MedicalExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      
      const response = await fetch(
        `http://localhost:5000/api/patients/${user.userId}/exams`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (examId) => {
    const { value: files } = await Swal.fire({
      title: "Télécharger des résultats",
      input: "file",
      inputAttributes: {
        multiple: true,
        accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
      },
      showCancelButton: true,
      confirmButtonText: "Télécharger",
      cancelButtonText: "Annuler",
      inputValidator: (value) => {
        if (!value || value.length === 0) {
          return "Veuillez sélectionner au moins un fichier";
        }
        return null;
      },
    });

    if (files) {
      setUploading(true);
      try {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        
        // Ajouter chaque fichier
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i]);
        }

        const response = await fetch(
          `http://localhost:5000/api/exams/${examId}/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const data = await response.json();
        
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Succès!",
            text: "Résultats téléchargés avec succès",
          });
          fetchExams(); // Rafraîchir la liste
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Impossible de télécharger les fichiers",
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "REQUESTED":
        return <FaClock className="status-requested" />;
      case "COMPLETED":
        return <FaCheckCircle className="status-completed" />;
      case "RESULTS_UPLOADED":
        return <FaUpload className="status-uploaded" />;
      case "REVIEWED":
        return <FaCheckCircle className="status-reviewed" />;
      default:
        return <FaExclamationTriangle />;
    }
  };

  if (loading) {
    return <div className="loading">Chargement des examens...</div>;
  }

  return (
    <div className="medical-exams-page">
      <div className="page-header">
        <h1>
          <FaFlask /> Mes Examens Médicaux
        </h1>
        <p>Consultez et gérez vos demandes d'examens</p>
      </div>

      {exams.length === 0 ? (
        <div className="no-exams">
          <FaFlask size={64} />
          <h3>Aucun examen</h3>
          <p>Vous n'avez pas encore de demande d'examen médical.</p>
        </div>
      ) : (
        <div className="exams-list">
          {exams.map((exam) => (
            <div key={exam._id} className="exam-card">
              <div className="exam-header">
                <div className="exam-info">
                  <h4>
                    {getStatusIcon(exam.status)} {exam.examTypeLabel}
                  </h4>
                  <p className="doctor">
                    <FaUserMd /> Dr. {exam.doctorId?.fullName}
                  </p>
                  <p className="date">
                    <FaCalendarAlt />{" "}
                    {new Date(exam.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                
                <div className="exam-status">
                  <span className={`status-badge ${exam.status.toLowerCase()}`}>
                    {exam.status === "REQUESTED"
                      ? "Demandé"
                      : exam.status === "COMPLETED"
                      ? "Réalisé"
                      : exam.status === "RESULTS_UPLOADED"
                      ? "Résultats envoyés"
                      : "Analysé"}
                  </span>
                </div>
              </div>

              <div className="exam-body">
                <div className="exam-details">
                  <p>
                    <strong>Raison :</strong> {exam.reason}
                  </p>
                  
                  {exam.instructions && (
                    <p>
                      <strong>Instructions :</strong> {exam.instructions}
                    </p>
                  )}
                  
                  {exam.preparationNeeded && (
                    <p>
                      <strong>Préparation :</strong> {exam.preparationNeeded}
                    </p>
                  )}
                  
                  {exam.fastingRequired && (
                    <p className="warning">
                      <FaExclamationTriangle /> Jeûne requis: {exam.fastingDuration}
                    </p>
                  )}
                </div>

                {exam.results && exam.results.length > 0 && (
                  <div className="exam-results">
                    <h5>
                      <FaFilePdf /> Résultats ({exam.results.length})
                    </h5>
                    <div className="results-list">
                      {exam.results.map((result, index) => (
                        <div key={index} className="result-item">
                          <span>{result.fileName}</span>
                          <button
                            className="btn-small"
                            onClick={() => window.open(result.fileUrl, "_blank")}
                          >
                            Voir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exam.doctorComments && (
                  <div className="doctor-comments">
                    <h5>Commentaires du médecin</h5>
                    <p>{exam.doctorComments}</p>
                  </div>
                )}
              </div>

              <div className="exam-actions">
                {exam.status === "REQUESTED" && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      // Télécharger la demande PDF
                      window.open(
                        `http://localhost:5000/api/exams/${exam._id}/request-pdf`,
                        "_blank"
                      );
                    }}
                  >
                    <FaFilePdf /> Télécharger la demande
                  </button>
                )}
                
                {exam.status === "COMPLETED" && (
                  <button
                    className="btn-primary"
                    onClick={() => handleFileUpload(exam._id)}
                    disabled={uploading}
                  >
                    <FaUpload /> {uploading ? "Téléchargement..." : "Envoyer les résultats"}
                  </button>
                )}
                
                {exam.status === "RESULTS_UPLOADED" && (
                  <p className="waiting">
                    <FaClock /> En attente de l'analyse du médecin
                  </p>
                )}
                
                {exam.status === "REVIEWED" && (
                  <p className="reviewed">
                    <FaCheckCircle /> Résultats analysés par le médecin
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalExamsPage;