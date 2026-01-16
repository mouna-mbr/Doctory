import React, { useState } from "react";
import "../assets/css/TwoFactor.css";

export default function TwoFactor() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

      // 🔗 BACKEND API (exemple)
      const res = await fetch("http://localhost:5000/api/auth/verify-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Code invalide");
      }

      setSuccess("Vérification réussie !");
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/resend-2fa", {
        method: "POST"
      });
      setSuccess("Un nouveau code a été envoyé");
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
