import { useParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../../assets/css/Appointment.css"; // Même fichier CSS que le rendez-vous
import { FaPills, FaFileMedicalAlt, FaPlus, FaTrash, FaSave, FaRedo } from "react-icons/fa";

export default function CreatePrescription() {
  const { appointmentId } = useParams();
  const [loading, setLoading] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [medicalAdvice, setMedicalAdvice] = useState("");
  const [medications, setMedications] = useState([
    {
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      quantity: 1,
    },
  ]);

  const addMedication = () => {
    setMedications([...medications, {
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      quantity: 1,
    }]);
  };

  const updateMedication = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const submitPrescription = async () => {
    // Validation avec SweetAlert
    if (!diagnosis.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Diagnostic requis',
        text: 'Veuillez saisir un diagnostic',
        confirmButtonColor: '#1B2688',
      });
      return;
    }
    
    // Vérifier qu'au moins un médicament a un nom
    const hasMedications = medications.some(med => med.name.trim() !== "");
    if (!hasMedications) {
      Swal.fire({
        icon: 'warning',
        title: 'Médicaments requis',
        text: 'Veuillez ajouter au moins un médicament',
        confirmButtonColor: '#1B2688',
      });
      return;
    }

    setLoading(true);
    
    // SweetAlert de chargement
    Swal.fire({
      title: 'Création en cours...',
      text: 'Veuillez patienter pendant la création de l\'ordonnance',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await axios.post(
        `http://localhost:5000/api/prescriptions/appointment/${appointmentId}/prescription`,
        {
          diagnosis,
          medicalAdvice,
          medications: medications.filter(med => med.name.trim() !== ""),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Fermer l'alerte de chargement
      Swal.close();
      
      // Succès avec SweetAlert
      Swal.fire({
        icon: 'success',
        title: 'Succès !',
        text: 'Ordonnance créée avec succès (brouillon)',
        confirmButtonColor: '#28a745',
        showConfirmButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          // Réinitialiser le formulaire
          setDiagnosis("");
          setMedicalAdvice("");
          setMedications([{
            name: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
            quantity: 1,
          }]);
        }
      });

    } catch (err) {
      // Fermer l'alerte de chargement
      Swal.close();
      
      console.error("Erreur détaillée:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Erreur lors de la création de l'ordonnance";
      
      // Erreur avec SweetAlert
      Swal.fire({
        icon: 'error',
        title: 'Erreur !',
        html: `<div style="text-align: left;">
                <p><strong>${errorMessage}</strong></p>
                ${err.response?.data?.details ? 
                  `<p><small>Détails: ${err.response.data.details}</small></p>` : 
                  ''
                }
              </div>`,
        confirmButtonColor: '#dc3545',
      });
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un médicament avec confirmation SweetAlert
  const removeMedication = (index) => {
    if (medications.length > 1) {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: "Vous allez supprimer ce médicament de la liste",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1B2688',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      }).then((result) => {
        if (result.isConfirmed) {
          const updated = [...medications];
          updated.splice(index, 1);
          setMedications(updated);
          
          Swal.fire(
            'Supprimé !',
            'Le médicament a été supprimé.',
            'success'
          );
        }
      });
    }
  };

  // Confirmation avant de réinitialiser
  const handleReset = () => {
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
        setDiagnosis("");
        setMedicalAdvice("");
        setMedications([{
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
          quantity: 1,
        }]);
        
        Swal.fire(
          'Réinitialisé !',
          'Le formulaire a été réinitialisé.',
          'success'
        );
      }
    });
  };

  return (
    <div className="appointment-container">
      {/* Header */}
      <div className="appointment-header">
        <div className="doctor-header-info">
          <FaFileMedicalAlt className="doctor-icon" />
          <div>
            <h2>Créer une ordonnance</h2>
            <p className="doctor-info">
              Rendez-vous ID: <strong>{appointmentId}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="appointment-form">
        <h3><FaFileMedicalAlt /> Diagnostic *</h3>
        
        <div className="form-group">
          <label htmlFor="diagnosis">
            Diagnostic *
          </label>
          <textarea
            id="diagnosis"
            placeholder="Entrez le diagnostic du patient..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows="3"
            required
            disabled={loading}
          />
        </div>
      </div>

      {/* Médicaments */}
      <div className="slots-section">
        <h3>
          <FaPills /> Médicaments
        </h3>
        
        <div className="medication-grid">
          {medications.map((med, index) => (
            <div key={index} className="slot-card medication-card">
              <div className="medication-header">
                <span>Médicament #{index + 1}</span>
                {medications.length > 1 && (
                  <button 
                    type="button"
                    className="cancel-btn"
                    onClick={() => removeMedication(index)}
                    disabled={loading}
                    style={{ padding: '5px 10px', fontSize: '0.9rem' }}
                  >
                    <FaTrash /> Supprimer
                  </button>
                )}
              </div>
              
              <div className="form-group">
                <label>Nom du médicament *</label>
                <input 
                  placeholder="Ex: Paracétamol 500mg" 
                  value={med.name}
                  onChange={(e) => updateMedication(index, "name", e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Dosage</label>
                  <input 
                    placeholder="Ex: 500mg" 
                    value={med.dosage}
                    onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Fréquence</label>
                  <input 
                    placeholder="Ex: 2x/jour" 
                    value={med.frequency}
                    onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Durée</label>
                  <input 
                    placeholder="Ex: 7 jours" 
                    value={med.duration}
                    onChange={(e) => updateMedication(index, "duration", e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Quantité</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="1"
                    value={med.quantity}
                    onChange={(e) => updateMedication(index, "quantity", parseInt(e.target.value) || 1)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Instructions</label>
                <input 
                  placeholder="Ex: avant les repas" 
                  value={med.instructions}
                  onChange={(e) => updateMedication(index, "instructions", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={addMedication}
          className="secondary-btn"
          disabled={loading}
          style={{ marginTop: '1rem' }}
        >
          <FaPlus /> Ajouter un médicament
        </button>
      </div>

      {/* Conseils médicaux */}
      <div className="appointment-form">
        <h3>💡 Conseils médicaux</h3>
        
        <div className="form-group">
          <label htmlFor="medicalAdvice">
            Conseils pour le patient
          </label>
          <textarea
            id="medicalAdvice"
            placeholder="Entrez les conseils médicaux pour le patient..."
            value={medicalAdvice}
            onChange={(e) => setMedicalAdvice(e.target.value)}
            rows="3"
            disabled={loading}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="booking-actions">
        <button 
          className={`book-btn ${!diagnosis.trim() || loading ? "disabled" : ""}`}
          disabled={!diagnosis.trim() || loading}
          onClick={submitPrescription}
        >
          {loading ? (
            <>
              <span className="spinner-small"></span>
              Enregistrement en cours...
            </>
          ) : (
            <>
              <FaSave /> Enregistrer (Brouillon)
            </>
          )}
        </button>
        
        <button 
          type="button" 
          className="cancel-btn"
          onClick={handleReset}
          disabled={loading}
        >
          <FaRedo /> Réinitialiser
        </button>
      </div>

      {/* Informations */}
      <div className="appointment-info">
        <div className="info-item">
          <FaFileMedicalAlt />
          <small>* Champs obligatoires</small>
        </div>
        <div className="info-item">
          <FaFileMedicalAlt />
          <small>💊 Au moins un médicament est requis</small>
        </div>
        <div className="info-item">
          <FaFileMedicalAlt />
          <small>📄 L'ordonnance sera enregistrée comme brouillon</small>
        </div>
      </div>
    </div>
  );
}