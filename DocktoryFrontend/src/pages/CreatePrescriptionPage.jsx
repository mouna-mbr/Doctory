// pages/CreatePrescriptionPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaFileMedical,
  FaPills,
  FaUserMd,
  FaCalendarAlt,
  FaPlus,
  FaTrash,
  FaSave,
  FaCheckCircle,
} from "react-icons/fa";
import Swal from "sweetalert2";

const CreatePrescriptionPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [prescription, setPrescription] = useState({
    diagnosis: "",
    medications: [],
    medicalAdvice: "",
    recommendations: ""
  });
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
  });

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `http://localhost:5000/api/appointments/${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAppointment(data.data);
        
        // Vérifier s'il y a déjà une ordonnance pour ce rendez-vous
        const prescriptionResponse = await fetch(
          `http://localhost:5000/api/appointment/${appointmentId}/prescription`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const prescriptionData = await prescriptionResponse.json();
        if (prescriptionData.success && prescriptionData.data) {
          setPrescription(prescriptionData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching appointment details:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de charger les détails du rendez-vous",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency || !newMedication.duration) {
      Swal.fire({
        icon: "warning",
        title: "Champs manquants",
        text: "Veuillez remplir tous les champs obligatoires du médicament",
      });
      return;
    }

    setPrescription(prev => ({
      ...prev,
      medications: [...prev.medications, { ...newMedication }]
    }));

    setNewMedication({
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: ""
    });
  };

  const handleRemoveMedication = (index) => {
    Swal.fire({
      title: "Supprimer le médicament?",
      text: "Êtes-vous sûr de vouloir supprimer ce médicament?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler"
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedMedications = [...prescription.medications];
        updatedMedications.splice(index, 1);
        setPrescription(prev => ({ ...prev, medications: updatedMedications }));
      }
    });
  };

  const handleSavePrescription = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Vérifier s'il y a au moins un médicament
      if (prescription.medications.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Médicaments requis",
          text: "Veuillez ajouter au moins un médicament à l'ordonnance",
        });
        return;
      }

      // Créer ou mettre à jour l'ordonnance
      const method = prescription._id ? "PUT" : "POST";
      const url = prescription._id 
        ? `http://localhost:5000/api/prescriptions/${prescription._id}`
        : `http://localhost:5000/api/appointment/${appointmentId}/prescription`;

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prescription),
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: prescription._id ? "Ordonnance mise à jour!" : "Ordonnance créée!",
          text: prescription._id 
            ? "L'ordonnance a été mise à jour avec succès"
            : "L'ordonnance a été créée avec succès. Vous pouvez maintenant la signer.",
        });
        
        if (prescription._id) {
          setPrescription(data.data);
        } else {
          navigate(`/doctor/dashboard`);
        }
      }
    } catch (error) {
      console.error("Error saving prescription:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de sauvegarder l'ordonnance",
      });
    }
  };

  const handleSignPrescription = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `http://localhost:5000/api/prescriptions/${prescription._id}/sign`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Ordonnance signée!",
          text: "L'ordonnance a été signée et envoyée au patient",
        });
        navigate("/doctor/dashboard");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de signer l'ordonnance",
      });
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="error-page">
        <h2>Rendez-vous introuvable</h2>
        <p>Le rendez-vous spécifié n'existe pas ou vous n'y avez pas accès.</p>
        <button onClick={() => navigate("/doctor/dashboard")}>
          Retour au dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="create-prescription-page">
      <div className="page-header">
        <h1>
          <FaFileMedical /> Créer une Ordonnance
        </h1>
        <p>Pour le rendez-vous du {new Date(appointment.startDateTime).toLocaleDateString("fr-FR")}</p>
      </div>

      <div className="prescription-form">
        {/* Informations patient */}
        <div className="patient-info-section">
          <h3>
            <FaUserMd /> Patient: {appointment.patientId?.fullName}
          </h3>
          <p>Consultation du {new Date(appointment.startDateTime).toLocaleDateString("fr-FR")}</p>
        </div>

        {/* Diagnostic */}
        <div className="form-section">
          <label htmlFor="diagnosis">Diagnostic</label>
          <textarea
            id="diagnosis"
            value={prescription.diagnosis}
            onChange={(e) => setPrescription({...prescription, diagnosis: e.target.value})}
            placeholder="Entrez le diagnostic..."
            rows={3}
          />
        </div>

        {/* Médicaments */}
        <div className="form-section">
          <h3>
            <FaPills /> Médicaments
          </h3>
          
          <div className="add-medication-form">
            <div className="medication-fields">
              <input
                type="text"
                placeholder="Nom du médicament*"
                value={newMedication.name}
                onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
              />
              <input
                type="text"
                placeholder="Dosage (ex: 500mg)*"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
              />
              <input
                type="text"
                placeholder="Fréquence (ex: 3x/jour)*"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
              />
              <input
                type="text"
                placeholder="Durée (ex: 7 jours)*"
                value={newMedication.duration}
                onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
              />
              <input
                type="text"
                placeholder="Instructions spéciales"
                value={newMedication.instructions}
                onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
              />
            </div>
            <button
              className="btn-primary"
              onClick={handleAddMedication}
            >
              <FaPlus /> Ajouter le médicament
            </button>
          </div>

          {/* Liste des médicaments ajoutés */}
          {prescription.medications.length > 0 && (
            <div className="medications-list">
              <h4>Médicaments prescrits ({prescription.medications.length})</h4>
              {prescription.medications.map((med, index) => (
                <div key={index} className="medication-item">
                  <div className="med-info">
                    <strong>{med.name}</strong>
                    <div className="med-details">
                      <span>{med.dosage}</span>
                      <span>{med.frequency}</span>
                      <span>{med.duration}</span>
                      {med.instructions && <span>{med.instructions}</span>}
                    </div>
                  </div>
                  <button
                    className="btn-danger"
                    onClick={() => handleRemoveMedication(index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conseils médicaux */}
        <div className="form-section">
          <label htmlFor="medicalAdvice">Conseils médicaux</label>
          <textarea
            id="medicalAdvice"
            value={prescription.medicalAdvice}
            onChange={(e) => setPrescription({...prescription, medicalAdvice: e.target.value})}
            placeholder="Entrez les conseils médicaux..."
            rows={3}
          />
        </div>

        {/* Recommandations */}
        <div className="form-section">
          <label htmlFor="recommendations">Recommandations</label>
          <textarea
            id="recommendations"
            value={prescription.recommendations}
            onChange={(e) => setPrescription({...prescription, recommendations: e.target.value})}
            placeholder="Entrez les recommandations..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/doctor/dashboard")}
          >
            Annuler
          </button>
          
          <button
            className="btn-primary"
            onClick={handleSavePrescription}
          >
            <FaSave /> {prescription._id ? "Mettre à jour" : "Sauvegarder le brouillon"}
          </button>
          
          {prescription._id && prescription.status === "DRAFT" && (
            <button
              className="btn-success"
              onClick={handleSignPrescription}
            >
              <FaCheckCircle /> Signer et envoyer au patient
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePrescriptionPage;