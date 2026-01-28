// pages/ReviewExamPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaFlask,
  FaFilePdf,
  FaUserMd,
  FaCalendarAlt,
  FaStethoscope,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaCommentMedical,
  FaDownload,
  FaEye,
  FaArrowLeft,
  FaPaperclip,
  FaFileImage,
  FaFileMedical,
  FaPrint,
  FaShareAlt,
  FaHistory,
  FaUserCircle,
  FaHospital,
  FaNotesMedical,
  FaCommentDots,
} from "react-icons/fa";
import Swal from "sweetalert2";

const ReviewExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorComments, setDoctorComments] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [viewMode, setViewMode] = useState("details");

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `http://localhost:5000/api/exams/${examId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setExam(data.data);
        setDoctorComments(data.data.doctorComments || "");
      } else {
        throw new Error(data.message || "Erreur lors du chargement");
      }
    } catch (error) {
      console.error("Error fetching exam details:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de charger les détails de l'examen",
      }).then(() => {
        navigate("/doctor/dashboard");
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComments = async () => {
    if (!doctorComments.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Commentaires requis",
        text: "Veuillez ajouter vos commentaires avant de valider",
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `http://localhost:5000/api/exams/${examId}/review`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comments: doctorComments }),
        }
      );

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Analyse enregistrée!",
          text: "Vos commentaires ont été sauvegardés et envoyés au patient",
          confirmButtonText: "Retour au dashboard",
          showCancelButton: true,
          cancelButtonText: "Voir détails",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/doctor/dashboard");
          } else {
            setExam(data.data);
          }
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error saving comments:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message || "Impossible de sauvegarder les commentaires",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsNormal = () => {
    Swal.fire({
      title: "Marquer comme normal",
      text: "Êtes-vous sûr de vouloir marquer ces résultats comme normaux?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, normal",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        setDoctorComments(prev => 
          prev + "\n\n---\nRésultats considérés comme normaux."
        );
      }
    });
  };

  const handleMarkAsAbnormal = () => {
    Swal.fire({
      title: "Signaler une anomalie",
      input: "textarea",
      inputLabel: "Description de l'anomalie",
      inputPlaceholder: "Décrivez l'anomalie détectée...",
      showCancelButton: true,
      confirmButtonText: "Confirmer",
      cancelButtonText: "Annuler",
      inputValidator: (value) => {
        if (!value) {
          return "Veuillez décrire l'anomalie";
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setDoctorComments(prev => 
          prev + `\n\n---\nANOMALIE DÉTECTÉE:\n${result.value}`
        );
      }
    });
  };

  const handleDownloadAllResults = () => {
    Swal.fire({
      title: "Télécharger tous les résultats",
      text: "Voulez-vous télécharger tous les fichiers de résultats?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Télécharger",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        // Implémenter le téléchargement ZIP si nécessaire
        exam.results.forEach((result, index) => {
          const link = document.createElement("a");
          link.href = result.fileUrl;
          link.download = `resultat-${index + 1}-${result.fileName}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
        
        Swal.fire({
          icon: "success",
          title: "Téléchargement lancé",
          text: "Les fichiers sont en cours de téléchargement",
          timer: 2000,
        });
      }
    });
  };

  const handlePrintReport = () => {
    const printContent = document.getElementById("exam-report-content");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Rapport d'examen - ${exam.examTypeLabel}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .patient-info { margin-bottom: 20px; }
              .exam-details { margin-bottom: 20px; }
              .results { margin-bottom: 20px; }
              .comments { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; }
              .signature { margin-top: 50px; text-align: right; }
              @media print {
                body { font-size: 12pt; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "PDF":
        return <FaFilePdf className="text-red-500" />;
      case "IMAGE":
        return <FaFileImage className="text-green-500" />;
      default:
        return <FaFileMedical className="text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="review-exam-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des résultats d'examen...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="exam-not-found">
        <FaExclamationTriangle size={64} />
        <h2>Examen introuvable</h2>
        <p>Cet examen n'existe pas ou vous n'y avez pas accès.</p>
        <button 
          className="btn-primary"
          onClick={() => navigate("/doctor/dashboard")}
        >
          <FaArrowLeft /> Retour au dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="review-exam-page">
      {/* En-tête */}
      <div className="review-header">
        <button 
          className="back-button"
          onClick={() => navigate("/doctor/dashboard")}
        >
          <FaArrowLeft /> Retour
        </button>
        
        <div className="header-content">
          <h1>
            <FaStethoscope /> Analyse des résultats d'examen
          </h1>
          <p className="exam-type">
            <FaFlask /> {exam.examTypeLabel}
          </p>
        </div>

        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={handlePrintReport}
          >
            <FaPrint /> Imprimer le rapport
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => setViewMode(viewMode === "details" ? "results" : "details")}
          >
            {viewMode === "details" ? "Voir résultats" : "Voir détails"}
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="review-content">
        {/* Section gauche - Informations */}
        <div className="info-section">
          {/* Informations patient */}
          <div className="patient-card">
            <div className="patient-header">
              <div className="patient-avatar">
                {exam.patientId?.profileImage ? (
                  <img 
                    src={exam.patientId.profileImage} 
                    alt={exam.patientId.fullName}
                  />
                ) : (
                  <FaUserCircle />
                )}
              </div>
              <div className="patient-details">
                <h3>{exam.patientId?.fullName}</h3>
                <p className="patient-info">
                  {exam.patientId?.dateOfBirth && (
                    <span>Né(e) le: {formatDate(exam.patientId.dateOfBirth)}</span>
                  )}
                  {exam.patientId?.gender && (
                    <span>• Sexe: {exam.patientId.gender === "male" ? "Masculin" : "Féminin"}</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="exam-request-info">
              <h4>
                <FaCalendarAlt /> Demande d'examen
              </h4>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Date de la demande:</strong>
                  <span>{formatDate(exam.createdAt)}</span>
                </div>
                <div className="info-item">
                  <strong>Raison:</strong>
                  <span>{exam.reason}</span>
                </div>
                <div className="info-item">
                  <strong>Priorité:</strong>
                  <span className={`priority-badge ${exam.priority.toLowerCase()}`}>
                    {exam.priority === "URGENT" ? "Urgente" : "Normale"}
                  </span>
                </div>
                {exam.instructions && (
                  <div className="info-item">
                    <strong>Instructions:</strong>
                    <span>{exam.instructions}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions spéciales */}
          {exam.preparationNeeded && (
            <div className="special-instructions">
              <h4>
                <FaExclamationTriangle /> Préparation requise
              </h4>
              <p>{exam.preparationNeeded}</p>
              
              {exam.fastingRequired && (
                <div className="fasting-info">
                  <FaClock /> Jeûne requis: {exam.fastingDuration}
                </div>
              )}
            </div>
          )}

          {/* Laboratoire */}
          {exam.labName && (
            <div className="lab-info">
              <h4>
                <FaHospital /> Laboratoire/Centre d'examen
              </h4>
              <p><strong>Nom:</strong> {exam.labName}</p>
              {exam.labAddress && (
                <p><strong>Adresse:</strong> {exam.labAddress}</p>
              )}
            </div>
          )}
        </div>

        {/* Section droite - Résultats et commentaires */}
        <div className="results-section">
          {/* Onglets */}
          <div className="results-tabs">
            <button 
              className={`tab-btn ${viewMode === "results" ? "active" : ""}`}
              onClick={() => setViewMode("results")}
            >
              <FaFilePdf /> Résultats ({exam.results?.length || 0})
            </button>
            <button 
              className={`tab-btn ${viewMode === "comments" ? "active" : ""}`}
              onClick={() => setViewMode("comments")}
            >
              <FaCommentMedical /> Analyse médicale
            </button>
            <button 
              className={`tab-btn ${viewMode === "history" ? "active" : ""}`}
              onClick={() => setViewMode("history")}
            >
              <FaHistory /> Historique
            </button>
          </div>

          {/* Contenu des onglets */}
          <div className="tab-content">
            {viewMode === "results" && (
              <div className="results-view">
                <div className="results-header">
                  <h3>Fichiers de résultats</h3>
                  {exam.results && exam.results.length > 0 && (
                    <button 
                      className="btn-secondary"
                      onClick={handleDownloadAllResults}
                    >
                      <FaDownload /> Télécharger tout
                    </button>
                  )}
                </div>
                
                {exam.results && exam.results.length > 0 ? (
                  <div className="results-grid">
                    {exam.results.map((result, index) => (
                      <div 
                        key={index} 
                        className={`result-file-card ${selectedResult === index ? "selected" : ""}`}
                        onClick={() => setSelectedResult(index)}
                      >
                        <div className="file-icon">
                          {getFileIcon(result.fileType)}
                        </div>
                        <div className="file-info">
                          <h4>{result.fileName}</h4>
                          <p className="file-details">
                            {result.fileType} • {formatDate(result.uploadedAt)} • {result.uploadedBy === exam.patientId?._id ? "Patient" : "Médecin"}
                          </p>
                          {result.description && (
                            <p className="file-description">{result.description}</p>
                          )}
                        </div>
                        <div className="file-actions">
                          <button 
                            className="btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(result.fileUrl, "_blank");
                            }}
                          >
                            <FaEye /> Voir
                          </button>
                          <button 
                            className="btn-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement("a");
                              link.href = result.fileUrl;
                              link.download = result.fileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <FaDownload /> Télécharger
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-results">
                    <FaFilePdf size={48} />
                    <p>Aucun résultat téléchargé pour le moment</p>
                  </div>
                )}
              </div>
            )}

            {viewMode === "comments" && (
              <div className="comments-view">
                <div className="comments-header">
                  <h3>
                    <FaStethoscope /> Analyse médicale
                  </h3>
                  
                  <div className="quick-actions">
                    <button 
                      className="btn-success"
                      onClick={handleMarkAsNormal}
                    >
                      <FaCheckCircle /> Résultats normaux
                    </button>
                    <button 
                      className="btn-warning"
                      onClick={handleMarkAsAbnormal}
                    >
                      <FaExclamationTriangle /> Signaler anomalie
                    </button>
                  </div>
                </div>

                {/* Éditeur de commentaires */}
                <div className="comments-editor">
                  <label htmlFor="doctorComments">
                    <FaCommentDots /> Commentaires et interprétation médicale
                  </label>
                  <textarea
                    id="doctorComments"
                    value={doctorComments}
                    onChange={(e) => setDoctorComments(e.target.value)}
                    placeholder="Entrez votre analyse des résultats, vos observations cliniques, les recommandations et les actions à prendre..."
                    rows={12}
                  />
                  
                  <div className="editor-tools">
                    <div className="char-count">
                      {doctorComments.length} caractères
                    </div>
                    <div className="template-buttons">
                      <button 
                        className="btn-small"
                        onClick={() => setDoctorComments(prev => prev + "\n\nObservation: ")}
                      >
                        Ajouter observation
                      </button>
                      <button 
                        className="btn-small"
                        onClick={() => setDoctorComments(prev => prev + "\n\nRecommandation: ")}
                      >
                        Ajouter recommandation
                      </button>
                      <button 
                        className="btn-small"
                        onClick={() => setDoctorComments(prev => prev + "\n\nSuivi: ")}
                      >
                        Ajouter suivi
                      </button>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="comments-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      Swal.fire({
                        title: "Annuler les modifications",
                        text: "Voulez-vous annuler vos modifications?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Oui, annuler",
                        cancelButtonText: "Continuer",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          setDoctorComments(exam.doctorComments || "");
                        }
                      });
                    }}
                  >
                    Annuler
                  </button>
                  
                  <button 
                    className="btn-primary"
                    onClick={handleSaveComments}
                    disabled={saving || !doctorComments.trim()}
                  >
                    {saving ? (
                      <>
                        <div className="spinner-small"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> Enregistrer et notifier le patient
                      </>
                    )}
                  </button>
                </div>

                {/* Aperçu du rapport */}
                {doctorComments && (
                  <div className="report-preview">
                    <h4>
                      <FaNotesMedical /> Aperçu du rapport
                    </h4>
                    <div className="preview-content">
                      {doctorComments.split('\n').map((line, index) => (
                        <p key={index}>{line || <br />}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === "history" && (
              <div className="history-view">
                <h3>Historique de l'examen</h3>
                
                <div className="timeline">
                  {/* Création */}
                  <div className="timeline-item">
                    <div className="timeline-marker completed"></div>
                    <div className="timeline-content">
                      <h4>Demande créée</h4>
                      <p>Par Dr. {exam.doctorId?.fullName}</p>
                      <small>{formatDate(exam.createdAt)} à {formatTime(exam.createdAt)}</small>
                    </div>
                  </div>

                  {/* Téléchargement des résultats */}
                  {exam.results && exam.results.length > 0 && (
                    <div className="timeline-item">
                      <div className="timeline-marker completed"></div>
                      <div className="timeline-content">
                        <h4>Résultats téléchargés</h4>
                        <p>{exam.results.length} fichier(s) téléchargé(s)</p>
                        <small>
                          Dernier upload: {formatDate(exam.results[exam.results.length - 1].uploadedAt)}
                        </small>
                      </div>
                    </div>
                  )}

                  {/* Analyse précédente */}
                  {exam.reviewedAt && (
                    <div className="timeline-item">
                      <div className="timeline-marker completed"></div>
                      <div className="timeline-content">
                        <h4>Analysé précédemment</h4>
                        <p>Par Dr. {exam.reviewedBy?.fullName || exam.doctorId?.fullName}</p>
                        <small>{formatDate(exam.reviewedAt)} à {formatTime(exam.reviewedAt)}</small>
                        {exam.doctorComments && (
                          <div className="previous-comments">
                            <strong>Commentaires précédents:</strong>
                            <p>{exam.doctorComments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* État actuel */}
                  <div className="timeline-item current">
                    <div className="timeline-marker current"></div>
                    <div className="timeline-content">
                      <h4>En cours d'analyse</h4>
                      <p>En attente de votre validation</p>
                      <small>Maintenant</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu pour impression (caché) */}
      <div id="exam-report-content" style={{ display: "none" }}>
        <div className="header">
          <h1>Rapport d'analyse médicale</h1>
          <h2>{exam.examTypeLabel}</h2>
        </div>
        
        <div className="patient-info">
          <h3>Informations patient</h3>
          <p><strong>Nom:</strong> {exam.patientId?.fullName}</p>
          <p><strong>Date de naissance:</strong> {exam.patientId?.dateOfBirth ? formatDate(exam.patientId.dateOfBirth) : "Non spécifié"}</p>
          <p><strong>Sexe:</strong> {exam.patientId?.gender === "male" ? "Masculin" : "Féminin"}</p>
        </div>
        
        <div className="exam-details">
          <h3>Détails de l'examen</h3>
          <p><strong>Date de la demande:</strong> {formatDate(exam.createdAt)}</p>
          <p><strong>Raison:</strong> {exam.reason}</p>
          <p><strong>Priorité:</strong> {exam.priority === "URGENT" ? "Urgente" : "Normale"}</p>
          {exam.instructions && <p><strong>Instructions:</strong> {exam.instructions}</p>}
        </div>
        
        {exam.results && exam.results.length > 0 && (
          <div className="results">
            <h3>Résultats</h3>
            <ul>
              {exam.results.map((result, index) => (
                <li key={index}>{result.fileName}</li>
              ))}
            </ul>
          </div>
        )}
        
        {doctorComments && (
          <div className="comments">
            <h3>Analyse médicale</h3>
            <div style={{ whiteSpace: "pre-wrap" }}>{doctorComments}</div>
          </div>
        )}
        
        <div className="signature">
          <p>Analyse réalisée par:</p>
          <p><strong>Dr. {exam.doctorId?.fullName}</strong></p>
          <p>{exam.doctorId?.specialty}</p>
          <p>Date: {formatDate(new Date())}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewExamPage;