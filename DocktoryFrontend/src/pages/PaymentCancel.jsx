// src/pages/PaymentCancel.jsx
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaTimesCircle, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Vous pouvez récupérer des informations de l'URL si nécessaire
  const sessionId = searchParams.get('session_id');
  const appointmentId = searchParams.get('appointment_id');

  return (
    <div className="payment-cancel-container">
      <div className="payment-cancel-card">
        {/* Icône d'erreur */}
        <div className="cancel-icon">
          <FaTimesCircle size={64} />
        </div>

        <h1>Paiement Annulé</h1>
        
        <p className="cancel-message">
          Votre processus de paiement a été annulé. Aucun montant n'a été débité de votre compte.
        </p>

        {/* Détails facultatifs (si disponibles) */}
        {appointmentId && (
          <div className="details-section">
            <h3>
              <FaCalendarAlt /> Détails du rendez-vous
            </h3>
            <p>
              Votre rendez-vous (ID: <strong>{appointmentId}</strong>) reste confirmé.
              Vous pouvez réessayer le paiement depuis la page "Mes rendez-vous".
            </p>
          </div>
        )}

        <div className="action-buttons">
          {/* Bouton pour réessayer le paiement */}
          <button 
            className="btn-retry"
            onClick={() => navigate('/my-appointments')}
          >
            <FaCreditCard /> Retour à mes rendez-vous
          </button>
          
          {/* Bouton pour retourner à l'accueil */}
          <button 
            className="btn-home"
            onClick={() => navigate('/')}
          >
            Retour à l'accueil
          </button>
        </div>

        <div className="help-section">
          <p>
            <strong>Besoin d'aide ?</strong><br />
            Si vous rencontrez des difficultés de paiement, veuillez vérifier les informations de votre carte ou contacter votre banque.
          </p>
          <p>
            Pour toute question concernant votre rendez-vous, contactez notre support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;