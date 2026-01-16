import React, { useEffect, useState } from "react";
import "../assets/css/SecuritySettings.css";

export default function SecuritySettings() {
  const [twoFA, setTwoFA] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const token = localStorage.getItem("token");
  const API_BASE_URL = "http://localhost:5000/api";

  /* =========================
     LOAD 2FA STATUS
  ========================= */
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        
        if (!token || !userData) {
          window.location.href = "/signin";
          return;
        }

        const userInfo = JSON.parse(userData);
        
        const response = await fetch(`${API_BASE_URL}/users/${userInfo.id}?t=${Date.now()}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        });

        const data = await response.json();
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);
  /* =========================
     TOGGLE 2FA
  ========================= */
  const handleToggle2FA = async () => {
    const res = await fetch("http://localhost:5000/api/auth/toggle-2fa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enabled: !twoFA }),
    });

    const data = await res.json();
    if (data.success) {
      setTwoFA(!twoFA);
      alert(data.message);
    }
  };

  /* =========================
     CHANGE PASSWORD
  ========================= */
  const handleChangePassword = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Mot de passe modifié avec succès");
      setOldPassword("");
      setNewPassword("");
    } else {
      alert(data.message);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="security-container">
      <h2>Sécurité du compte</h2>

      {/* 2FA */}
      <div className="security-card">
        <h3>Double authentification (2FA)</h3>
        <p>
          Protégez votre compte avec un code envoyé par email à chaque connexion.
        </p>

        <button
          className={twoFA ? "btn-danger" : "btn-primary"}
          onClick={handleToggle2FA}
        >
          {twoFA ? "Désactiver le 2FA" : "Activer le 2FA"}
        </button>
      </div>

      {/* CHANGE PASSWORD */}
      <div className="security-card">
        <h3>Changer le mot de passe</h3>

        <form onSubmit={handleChangePassword}>
          <input
            type="password"
            placeholder="Ancien mot de passe"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <button className="btn-primary">Mettre à jour</button>
        </form>
      </div>
    </div>
  );
}
