import React, { useState, useEffect } from "react";
import {
  FaCreditCard,
  FaMobileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserMd,
  FaCalendarAlt,
  FaLock,
  FaShieldAlt,
  FaArrowLeft,
  FaReceipt,
  FaMoneyBillWave,
} from "react-icons/fa";
import { loadStripe } from "@stripe/stripe-js";
import Swal from "sweetalert2";
import "../assets/css/PaymentPage.css";

// Initialiser Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentPage = ({ appointmentId }) => {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [appointment, setAppointment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");

  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointment(data.data);
        
        // Vérifier le statut de paiement
        if (data.data.paymentStatus === "PAID") {
          setPaymentStatus("paid");
        } else if (data.data.paymentStatus === "PENDING") {
          setPaymentStatus("pending");
        }
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      
      // Créer la session Stripe
      const response = await fetch(`${API_BASE_URL}/payments/stripe/${appointmentId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Rediriger vers Stripe
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.data.sessionId,
        });

        if (error) {
          throw new Error(error.message);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error initiating card payment:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message,
      });
      setProcessing(false);
    }
  };

  const handleMobileMoneyPayment = async (provider) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/payments/mobile-money/${appointmentId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      
      if (data.success) {
        Swal.fire({
          icon: "info",
          title: "Instructions de paiement",
          html: `
            <div style="text-align: left;">
              <p><strong>Montant:</strong> ${data.data.amount} USD</p>
              <p><strong>Numéro:</strong> ${data.data.phoneNumber}</p>
              <p><strong>Instructions:</strong></p>
              <p>${data.data.instructions}</p>
              <p>Après avoir effectué le paiement, cliquez sur le bouton ci-dessous pour vérifier.</p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "J'ai payé, vérifier",
          cancelButtonText: "Annuler",
        }).then((result) => {
          if (result.isConfirmed) {
            verifyPayment(data.data.paymentId);
          }
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error initiating mobile money payment:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const verifyPayment = async (paymentId) => {
    try {
      setProcessing(true);
      // Ici, vous implémenteriez la vérification du paiement mobile money
      // Pour l'exemple, nous simulons une vérification
      
      setTimeout(async () => {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/payments/status/${appointmentId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data.appointment.paymentStatus === "PAID") {
            setPaymentStatus("paid");
            Swal.fire({
              icon: "success",
              title: "Paiement confirmé!",
              text: "Votre paiement a été confirmé avec succès.",
              confirmButtonText: "Accéder à la consultation",
            }).then(() => {
              // Rediriger vers la salle de consultation
              window.location.href = `/video/${data.data.appointment.videoRoomId}`;
            });
          } else {
            Swal.fire({
              icon: "warning",
              title: "Paiement en attente",
              text: "Votre paiement n'a pas encore été confirmé. Veuillez réessayer dans quelques minutes.",
            });
          }
        }
        setProcessing(false);
      }, 2000);
    } catch (error) {
      console.error("Error verifying payment:", error);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-container loading">
        <div className="spinner"></div>
        <p>Chargement des informations de paiement...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="payment-container error">
        <FaTimesCircle size={48} />
        <h3>Rendez-vous non trouvé</h3>
        <p>Impossible de charger les informations du rendez-vous.</p>
        <button 
          className="btn-secondary"
          onClick={() => window.history.back()}
        >
          <FaArrowLeft /> Retour
        </button>
      </div>
    );
  }

  if (paymentStatus === "paid") {
    return (
      <div className="payment-container success">
        <div className="success-content">
          <FaCheckCircle size={64} />
          <h2>Paiement confirmé!</h2>
          <p>Votre paiement a été effectué avec succès.</p>
          
          <div className="appointment-summary">
            <h4>Résumé du rendez-vous</h4>
            <div className="summary-item">
              <FaUserMd />
              <span><strong>Docteur:</strong> Dr. {appointment.doctorId?.fullName}</span>
            </div>
            <div className="summary-item">
              <FaCalendarAlt />
              <span><strong>Date:</strong> {new Date(appointment.startDateTime).toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="summary-item">
              <FaClock />
              <span><strong>Heure:</strong> {new Date(appointment.startDateTime).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="summary-item">
              <FaMoneyBillWave />
              <span><strong>Montant payé:</strong> {appointment.amount} USD</span>
            </div>
          </div>

          <button 
            className="btn-primary"
            onClick={() => window.location.href = `/video/${appointment.videoRoomId}`}
          >
            Accéder à la consultation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <button 
          className="back-button"
          onClick={() => window.history.back()}
        >
          <FaArrowLeft /> Retour
        </button>
        <h1><FaLock /> Paiement de la consultation</h1>
        <p className="subtitle">Sécurisé et crypté</p>
      </div>

      <div className="payment-content">
        <div className="appointment-details">
          <h3>Détails du rendez-vous</h3>
          <div className="details-grid">
            <div className="detail-card">
              <FaUserMd />
              <div>
                <small>Docteur</small>
                <p>Dr. {appointment.doctorId?.fullName}</p>
              </div>
            </div>
            <div className="detail-card">
              <FaCalendarAlt />
              <div>
                <small>Date</small>
                <p>{new Date(appointment.startDateTime).toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="detail-card">
              <FaClock />
              <div>
                <small>Heure</small>
                <p>{new Date(appointment.startDateTime).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="detail-card">
              <FaMoneyBillWave />
              <div>
                <small>Montant</small>
                <p className="amount">{appointment.amount} USD</p>
              </div>
            </div>
          </div>
        </div>

        <div className="payment-methods">
          <h3>Méthode de paiement</h3>
          <p className="secure-note">
            <FaShieldAlt /> Transactions sécurisées par cryptage SSL
          </p>

          <div className="method-options">
            <div 
              className={`method-option ${selectedMethod === "card" ? "selected" : ""}`}
              onClick={() => setSelectedMethod("card")}
            >
              <div className="method-icon">
                <FaCreditCard />
              </div>
              <div className="method-info">
                <h4>Carte bancaire</h4>
                <p>Visa, Mastercard, American Express</p>
              </div>
            </div>

            <div 
              className={`method-option ${selectedMethod === "orange" ? "selected" : ""}`}
              onClick={() => setSelectedMethod("orange")}
            >
              <div className="method-icon">
                <FaMobileAlt />
              </div>
              <div className="method-info">
                <h4>Orange Money</h4>
                <p>Paiement mobile sécurisé</p>
              </div>
            </div>

            <div 
              className={`method-option ${selectedMethod === "mtn" ? "selected" : ""}`}
              onClick={() => setSelectedMethod("mtn")}
            >
              <div className="method-icon">
                <FaMobileAlt />
              </div>
              <div className="method-info">
                <h4>MTN Mobile Money</h4>
                <p>Paiement mobile sécurisé</p>
              </div>
            </div>
          </div>

          {selectedMethod === "card" && (
            <div className="payment-form">
              <div className="form-group">
                <label>Numéro de carte</label>
                <input 
                  type="text" 
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  disabled={processing}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date d'expiration</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY"
                    maxLength="5"
                    disabled={processing}
                  />
                </div>
                <div className="form-group">
                  <label>CVC</label>
                  <input 
                    type="text" 
                    placeholder="123"
                    maxLength="3"
                    disabled={processing}
                  />
                </div>
              </div>
              <button 
                className="pay-button"
                onClick={handleCardPayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span className="spinner-small"></span>
                    Traitement...
                  </>
                ) : (
                  <>
                    <FaCreditCard /> Payer {appointment.amount} USD
                  </>
                )}
              </button>
              <p className="security-note">
                <FaShieldAlt /> Vos informations de paiement sont cryptées et sécurisées
              </p>
            </div>
          )}

          {(selectedMethod === "orange" || selectedMethod === "mtn") && (
            <div className="mobile-money-form">
              <div className="form-group">
                <label>Votre numéro de téléphone</label>
                <input 
                  type="tel"
                  placeholder="Ex: +221 77 123 45 67"
                  value={mobileMoneyNumber}
                  onChange={(e) => setMobileMoneyNumber(e.target.value)}
                  disabled={processing}
                />
              </div>
              <button 
                className="pay-button"
                onClick={() => handleMobileMoneyPayment(selectedMethod)}
                disabled={processing || !mobileMoneyNumber}
              >
                {processing ? (
                  <>
                    <span className="spinner-small"></span>
                    Préparation du paiement...
                  </>
                ) : (
                  <>
                    <FaMobileAlt /> Payer avec {selectedMethod === "orange" ? "Orange Money" : "MTN Mobile Money"}
                  </>
                )}
              </button>
              <div className="mobile-money-info">
                <h4>Comment payer avec Mobile Money:</h4>
                <ol>
                  <li>Cliquez sur le bouton "Payer" ci-dessus</li>
                  <li>Suivez les instructions à l'écran</li>
                  <li>Effectuez le paiement depuis votre application mobile</li>
                  <li>Confirmez le paiement dans cette page</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        <div className="payment-security">
          <div className="security-item">
            <FaShieldAlt />
            <div>
              <h4>Paiement sécurisé</h4>
              <p>Cryptage SSL 256-bit</p>
            </div>
          </div>
          <div className="security-item">
            <FaReceipt />
            <div>
              <h4>Reçu disponible</h4>
              <p>Téléchargez votre reçu après paiement</p>
            </div>
          </div>
          <div className="security-item">
            <FaCheckCircle />
            <div>
              <h4>Garantie de remboursement</h4>
              <p>Remboursement si annulation 24h à l'avance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;