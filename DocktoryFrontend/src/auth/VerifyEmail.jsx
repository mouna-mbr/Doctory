import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";
import "../assets/css/SignIn.css";
import logo from "../assets/photos/logobgWhite.png";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Vérification de votre email en cours...");

  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Lien de vérification invalide.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Votre email a été vérifié avec succès !");
          
          // Redirect to signin after 3 seconds
          setTimeout(() => {
            navigate("/signin");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "La vérification a échoué. Le lien est peut-être expiré.");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("Une erreur est survenue lors de la vérification.");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: "center", padding: "50px 30px" }}>
        <img src={logo} alt="Logo Doctory" className="logo-img" style={{ marginBottom: "30px" }} />

        {status === "verifying" && (
          <>
            <FaSpinner size={64} color="#3498db" style={{ animation: "spin 1s linear infinite" }} />
            <h2 style={{ marginTop: "20px" }}>Vérification en cours...</h2>
            <p>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <FaCheckCircle size={64} color="#27ae60" />
            <h2 style={{ marginTop: "20px", color: "#27ae60" }}>Email Vérifié !</h2>
            <p>{message}</p>
            <p style={{ marginTop: "20px", color: "#666" }}>
              Redirection vers la page de connexion...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <FaTimesCircle size={64} color="#e74c3c" />
            <h2 style={{ marginTop: "20px", color: "#e74c3c" }}>Erreur de Vérification</h2>
            <p>{message}</p>
            <div style={{ marginTop: "30px" }}>
              <button
                className="btn-primary"
                onClick={() => navigate("/signin")}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#2c3e50",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                Aller à la connexion
              </button>
            </div>
          </>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default VerifyEmail;
