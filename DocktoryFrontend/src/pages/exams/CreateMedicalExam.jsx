import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../../assets/css/Appointment.css"; // Même fichier CSS que le rendez-vous
import { 
  FaFlask, 
  FaCalendarAlt, 
  FaExclamationTriangle, 
  FaCheck, 
  FaTimes, 
  FaRedo,
  FaArrowLeft,
  FaFileMedicalAlt
} from "react-icons/fa";

const EXAMS = [
  { value: "BLOOD_TEST", label: "Analyse sanguine" },
  { value: "URINE_TEST", label: "Analyse urinaire" },
  { value: "X_RAY", label: "Radiographie" },
  { value: "CT_SCAN", label: "Scanner" },
  { value: "MRI", label: "IRM" },
  { value: "ULTRASOUND", label: "Échographie" },
  { value: "ECG", label: "ECG" },
  { value: "EEG", label: "EEG" },
  { value: "ENDOSCOPY", label: "Endoscopie" },
  { value: "COLONOSCOPY", label: "Colonoscopie" },
  { value: "MAMMOGRAPHY", label: "Mammographie" },
  { value: "OTHER", label: "Autre" },
];

export default function CreateMedicalExam() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [examType, setExamType] = useState("");
  const [examTypeLabel, setExamTypeLabel] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [fastingRequired, setFastingRequired] = useState(false);
  const [fastingDuration, setFastingDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [preparationNeeded, setPreparationNeeded] = useState("");

  const submitMedicalExam = async () => {
    // Validation avec SweetAlert
    if (!examType) {
      Swal.fire({
        icon: 'warning',
        title: 'Type d\'examen requis',
        text: 'Veuillez sélectionner un type d\'examen',
        confirmButtonColor: '#1B2688',
      });
      return;
    }
    if (!reason.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Motif requis',
        text: 'Veuillez saisir le motif de l\'examen',
        confirmButtonColor: '#1B2688',
      });
      return;
    }

    setLoading(true);
    
    // SweetAlert de chargement
    Swal.fire({
      title: 'Prescription en cours...',
      text: 'Veuillez patienter pendant la création de la prescription',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axios.post(
        `http://localhost:5000/api/medicalexams/appointment/${appointmentId}/exam`,
        {
          examType,
          examTypeLabel: examTypeLabel || EXAMS.find(e => e.value === examType)?.label,
          reason,
          priority,
          instructions,
          preparationNeeded,
          fastingRequired,
          fastingDuration: fastingRequired ? fastingDuration : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Fermer l'alerte de chargement
      Swal.close();
      
      // Succès avec SweetAlert
      Swal.fire({
        icon: 'success',
        title: 'Succès !',
        text: 'Examen prescrit avec succès',
        confirmButtonColor: '#28a745',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Voir le rendez-vous',
        denyButtonText: 'Créer un autre examen',
        cancelButtonText: 'Fermer'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(`/appointments/${appointmentId}`);
        } else if (result.isDenied) {
          // Réinitialiser le formulaire pour créer un autre examen
          resetForm();
        }
      });

    } catch (err) {
      // Fermer l'alerte de chargement
      Swal.close();
      
      console.error("Erreur détaillée:", err);
      
      let errorMessage = "Erreur lors de la prescription de l'examen";
      let errorDetails = "";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message.includes("Notification validation failed")) {
        errorMessage = "Configuration système incomplète";
        errorDetails = "Veuillez contacter l'administrateur pour ajouter les types de notification manquants.";
      } else if (err.response?.status === 404) {
        errorMessage = "Rendez-vous non trouvé";
      } else if (err.response?.status === 403) {
        errorMessage = "Accès non autorisé";
        errorDetails = "Vous n'êtes pas autorisé à prescrire un examen pour ce rendez-vous.";
      } else if (err.response?.status === 400) {
        errorMessage = "Données invalides";
        errorDetails = err.response?.data?.details || "Veuillez vérifier les informations saisies.";
      }
      
      // Erreur avec SweetAlert
      Swal.fire({
        icon: 'error',
        title: 'Erreur !',
        html: `<div style="text-align: left;">
                <p><strong>${errorMessage}</strong></p>
                ${errorDetails ? `<p><small>${errorDetails}</small></p>` : ''}
                ${err.response?.data?.validationErrors ? 
                  `<ul style="padding-left: 20px; margin-top: 10px;">
                    ${Object.entries(err.response.data.validationErrors).map(([field, msg]) => 
                      `<li><strong>${field}:</strong> ${msg}</li>`
                    ).join('')}
                  </ul>` : 
                  ''
                }
              </div>`,
        confirmButtonColor: '#dc3545',
      });
    } finally {
      setLoading(false);
    }
  };

  const getExamLabel = (value) => {
    return EXAMS.find(exam => exam.value === value)?.label || value;
  };

  // Fonction pour réinitialiser le formulaire avec confirmation
  const resetForm = () => {
    Swal.fire({
      title: 'Réinitialiser le formulaire ?',
      text: "Toutes les données saisies seront perdues",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1B2688',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, réinitialiser',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        setExamType("");
        setExamTypeLabel("");
        setReason("");
        setPriority("NORMAL");
        setFastingRequired(false);
        setFastingDuration("");
        setInstructions("");
        setPreparationNeeded("");
        
        Swal.fire(
          'Réinitialisé !',
          'Le formulaire a été réinitialisé.',
          'success'
        );
      }
    });
  };

  // Confirmation avant d'annuler
  const handleCancel = () => {
    Swal.fire({
      title: 'Quitter cette page ?',
      text: "Les données non enregistrées seront perdues",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1B2688',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, quitter',
      cancelButtonText: 'Rester'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(-1);
      }
    });
  };

  return (
    <div className="appointment-container">
      {/* Header avec bouton retour */}
      <div className="appointment-header">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          <FaArrowLeft /> Retour
        </button>
        
        <div className="doctor-header-info">
          <FaFlask className="doctor-icon" />
          <div>
            <h2>Prescrire un examen médical</h2>
            <p className="doctor-info">
              Rendez-vous ID: <strong>{appointmentId}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="appointment-form">
        <h3><FaFlask /> Informations de l'examen</h3>
        
        <div className="form-group">
          <label htmlFor="examType">
            Type d'examen *
          </label>
          <select
            id="examType"
            value={examType}
            onChange={(e) => {
              const value = e.target.value;
              setExamType(value);
              setExamTypeLabel(getExamLabel(value));
            }}
            required
            disabled={loading}
          >
            <option value="">-- Choisir un examen --</option>
            {EXAMS.map((exam) => (
              <option key={exam.value} value={exam.value}>
                {exam.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="reason">
            Motif de l'examen *
          </label>
          <textarea
            id="reason"
            placeholder="Décrivez le motif de l'examen (symptômes, suspicion diagnostique, suivi médical...)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
            required
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="instructions">
              Instructions spécifiques
            </label>
            <textarea
              id="instructions"
              placeholder="Instructions pour le patient (ex: apporter les anciens résultats...)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows="2"
              disabled={loading}
            />
          </div>
          
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="preparationNeeded">
              Préparation nécessaire
            </label>
            <textarea
              id="preparationNeeded"
              placeholder="Préparation spécifique (ex: vider la vessie...)"
              value={preparationNeeded}
              onChange={(e) => setPreparationNeeded(e.target.value)}
              rows="2"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Priorité et jeûne */}
      <div className="appointment-form">
        <h3><FaExclamationTriangle /> Paramètres additionnels</h3>
        
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="priority">
              Priorité
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={loading}
            >
              <option value="NORMAL">Priorité normale</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          
          <div className="form-group" style={{ flex: 1 }}>
            <label className="checkbox" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={fastingRequired}
                onChange={(e) => {
                  setFastingRequired(e.target.checked);
                  if (!e.target.checked) setFastingDuration("");
                }}
                disabled={loading}
              />
              <span>À jeun requis</span>
            </label>
          </div>
        </div>

        {fastingRequired && (
          <div className="form-group">
            <label htmlFor="fastingDuration">
              Durée du jeûne *
            </label>
            <input
              type="text"
              id="fastingDuration"
              placeholder="Ex: 8 heures, 12h, 1 nuit"
              value={fastingDuration}
              onChange={(e) => setFastingDuration(e.target.value)}
              disabled={loading}
              required={fastingRequired}
            />
            <small className="form-text">Spécifiez la durée du jeûne requis avant l'examen</small>
          </div>
        )}
      </div>

      {/* Résumé de la prescription */}
      {examType && (
        <div className="selected-slot-info">
          <h4>Résumé de la prescription :</h4>
          <div className="slot-details">
            <div className="detail-item">
              <FaFlask />
              <span><strong>Type d'examen :</strong> {getExamLabel(examType)}</span>
            </div>
            {reason && (
              <div className="detail-item">
                <FaFileMedicalAlt />
                <span><strong>Motif :</strong> {reason}</span>
              </div>
            )}
            {priority && (
              <div className="detail-item">
                <FaExclamationTriangle />
                <span><strong>Priorité :</strong> {priority === "URGENT" ? "Urgent" : "Normale"}</span>
              </div>
            )}
            {fastingRequired && (
              <div className="detail-item">
                <FaTimes />
                <span><strong>Jeûne requis :</strong> {fastingDuration || "Oui"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="booking-actions">
        <button 
          className={`book-btn ${!examType || !reason.trim() || loading ? "disabled" : ""}`}
          disabled={!examType || !reason.trim() || loading}
          onClick={submitMedicalExam}
        >
          {loading ? (
            <>
              <span className="spinner-small"></span>
              Prescription en cours...
            </>
          ) : (
            <>
              <FaCheck /> Prescrire l'examen
            </>
          )}
        </button>
        
        <button 
          type="button" 
          className="cancel-btn"
          onClick={resetForm}
          disabled={loading}
        >
          <FaRedo /> Réinitialiser
        </button>
        
        <button 
          type="button" 
          className="secondary-btn"
          onClick={handleCancel}
          disabled={loading}
        >
          <FaTimes /> Annuler
        </button>
      </div>

      {/* Informations */}
      <div className="appointment-info">
        <div className="info-item">
          <FaFlask />
          <small>* Champs obligatoires</small>
        </div>
        <div className="info-item">
          <FaFlask />
          <small>⚠️ Le jeûne n'est requis que pour certains examens</small>
        </div>
        <div className="info-item">
          <FaFlask />
          <small>📋 Les instructions sont importantes pour la préparation du patient</small>
        </div>
      </div>
    </div>
  );
}