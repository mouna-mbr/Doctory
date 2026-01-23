import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaCalendarAlt, FaUserMd, FaClock,FaTimesCircle  } from "react-icons/fa";
import Swal from "sweetalert2";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get("session_id");
        
        if (!sessionId) {
          setError("Aucune session de paiement trouvée");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/payments/verify`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();
        
        if (data.success) {
          setPaymentData(data.data);
          
          // Afficher une notification de succès
          Swal.fire({
            icon: "success",
            title: "Paiement réussi!",
            text: "Votre paiement a été confirmé avec succès.",
            timer: 3000,
            showConfirmButton: false,
          });

          // Rediriger vers la page des rendez-vous après 3 secondes
          setTimeout(() => {
            navigate("/my-appointments");
          }, 3000);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("Erreur lors de la vérification du paiement");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="payment-success-container">
        <div className="loading-spinner"></div>
        <p>Vérification de votre paiement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-success-container error">
        <div className="error-content">
          <FaTimesCircle size={48} />
          <h3>Erreur de paiement</h3>
          <p>{error}</p>
          <button 
            className="btn-primary"
            onClick={() => navigate("/my-appointments")}
          >
            Retour aux rendez-vous
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="success-content">
        <FaCheckCircle className="success-icon" />
        <h1>Paiement Réussi!</h1>
        <p className="success-message">
          Votre paiement a été effectué avec succès. Votre rendez-vous est maintenant confirmé.
        </p>
        
        {paymentData && (
          <div className="payment-details">
            <h3>Détails du paiement</h3>
            <div className="detail-item">
              <FaCalendarAlt />
              <span>Date: {new Date(paymentData.appointment.startDateTime).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <FaClock />
              <span>Heure: {new Date(paymentData.appointment.startDateTime).toLocaleTimeString()}</span>
            </div>
            <div className="detail-item">
              <FaUserMd />
              <span>Médecin: Dr. {paymentData.appointment.doctorId.name}</span>
            </div>
            <div className="detail-item amount">
              <span>Montant: </span>
              <strong>{paymentData.amount} {paymentData.currency}</strong>
            </div>
          </div>
        )}
        
        <div className="next-steps">
          <h3>Prochaines étapes:</h3>
          <ul>
            <li>Vous allez être redirigé vers vos rendez-vous</li>
            <li>Vous pouvez rejoindre la consultation 10 minutes avant l'horaire prévu</li>
            <li>Un rappel vous sera envoyé par email</li>
          </ul>
        </div>
        
        <button 
          className="btn-primary"
          onClick={() => navigate("/my-appointments")}
        >
          Voir mes rendez-vous
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;