"use client"
import { useState, useEffect } from "react"
import "../assets/css/Profile.css"

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        
        const response = await fetch(`http://localhost:5000/api/users/${userInfo.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setUser(data.data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return <div className="profile-page">Chargement...</div>;
  }

  if (!user) {
    return <div className="profile-page">Erreur de chargement du profil</div>;
  }

  return (
    <div className="profile-page">
      {/* SIDEBAR */}
      <aside className="profile-sidebar">
        <img 
          src={`https://ui-avatars.com/api/?name=${user.fullName}&background=1B2688&color=fff&size=150`} 
          alt="profile" 
          className="profile-avatar" 
        />
        <h3>{user.fullName}</h3>
        <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>

        <ul>
        <li>📄 Informations</li>
        <li>
             <a href="/dossier">📂 Dossiers</a>
        </li>
        {user.role !== "patient" && <li>⭐ Avis</li>}
        <li>
            <a href="/settings">⚙️ Paramètres</a>
        </li>
        </ul>

      </aside>

      {/* MAIN CONTENT */}
      <main className="profile-content">
        {/* INFO CARD */}
        <section className="card">
          <h2>Informations générales</h2>
          <div className="info-grid">
            <p><strong>Email :</strong> {user.email}</p>
            <p><strong>Téléphone :</strong> {user.phoneNumber}</p>

            {user.role === "DOCTOR" && (
              <>
                <p><strong>Spécialité :</strong> {user.specialty || "Non spécifiée"}</p>
                <p><strong>Expérience :</strong> {user.yearsOfExperience || 0} ans</p>
                <p><strong>Consultation :</strong> {user.consultationPrice || 0} DT</p>
              </>
            )}

            {user.role === "PHARMACIST" && (
              <p><strong>Pharmacie :</strong> {user.pharmacyName || "Non spécifiée"}</p>
            )}
          </div>
        </section>

        {/* PATIENT DOSSIER */}
        {user.role === "PATIENT" && (
          <section className="card">
            <h2>Dossier médical</h2>
            <div className="medical-box">
              <p>🩺 Groupe sanguin : O+</p>
              <p>⚠️ Allergies : Aucune</p>
              <p>📄 Ordonnances : 3 fichiers</p>
            </div>
          </section>
        )}

        {/* REVIEWS */}
        {user.role !== "PATIENT" && (
          <section className="card">
            <h2>Avis</h2>
            <div className="review">
              ⭐⭐⭐⭐⭐
              <p>Excellent service, très professionnel.</p>
            </div>
            <div className="review">
              ⭐⭐⭐⭐☆
              <p>Bonne expérience globale.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Profile
