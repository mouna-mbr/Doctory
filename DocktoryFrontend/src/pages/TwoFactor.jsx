import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../assets/css/TwoFactor.css";

export default function TwoFactor() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  useEffect(() => {
    // Redirect if no userId provided
    if (!userId) {
      navigate("/signin");
    }
  }, [userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/verify-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, code })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Code invalide");
      }

      // Store the token and user data
      if (data.data && data.data.token) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      setSuccess("Vérification réussie !");
      setTimeout(() => {
        // Redirect based on user role
        const userRole = data.data.user.role;
        if (userRole === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      setError("");
      setSuccess("");
      setSuccess("Fonctionnalité bientôt disponible");
    } catch {
      setError("Erreur lors de l’envoi du code");
    }
  };

  return (
    <div className="twofa-page">
      <div className="twofa-card">
        <h2>Vérification de sécurité</h2>
        <p>
          Un code de vérification a été envoyé à votre adresse email.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            maxLength="6"
            placeholder="Entrez le code à 6 chiffres"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Vérification..." : "Vérifier"}
          </button>
        </form>

        <button className="resend-btn" onClick={resendCode}>
          Renvoyer le code
        </button>
      </div>
    </div>
  );
}
