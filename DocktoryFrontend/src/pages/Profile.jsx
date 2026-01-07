"use client"
import { useState } from "react"
import "../assets/css/Profile.css"

const Profile = () => {
  // Simuler un user connecté
  const [user] = useState({
    role: "doctor", // doctor | patient | pharmacist
    fullName: "Dr. Ahmed Ben Ali",
    email: "ahmed@doctory.tn",
    phone: "22123456",
    photo: "https://i.pravatar.cc/150?img=32",
    speciality: "Cardiologue",
    experience: 8,
    consultationPrice: 60,
    pharmacyName: "",
  })

  return (
    <div className="profile-page">
      {/* SIDEBAR */}
      <aside className="profile-sidebar">
        <img src={user.photo} alt="profile" className="profile-avatar" />
        <h3>{user.fullName}</h3>
        <span className={`role-badge ${user.role}`}>{user.role}</span>

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
            <p><strong>Téléphone :</strong> {user.phone}</p>

            {user.role === "doctor" && (
              <>
                <p><strong>Spécialité :</strong> {user.speciality}</p>
                <p><strong>Expérience :</strong> {user.experience} ans</p>
                <p><strong>Consultation :</strong> {user.consultationPrice} DT</p>
              </>
            )}

            {user.role === "pharmacist" && (
              <p><strong>Pharmacie :</strong> {user.pharmacyName}</p>
            )}
          </div>
        </section>

        {/* PATIENT DOSSIER */}
        {user.role === "patient" && (
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
        {user.role !== "patient" && (
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
