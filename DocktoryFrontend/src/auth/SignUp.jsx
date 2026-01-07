"use client"

import { useState } from "react"
import { FaStethoscope, FaPills, FaHeartbeat, FaSyringe, FaFlask } from "react-icons/fa"
import "../assets/css/SignUp.css"
import logo from "../assets/photos/logobgWhite.png"

const SignUp = () => {
  const [role, setRole] = useState("")

  return (
    <div className="auth-container">
      <div className="medical-icons-bg">
        <div className="icon-item">
          <FaStethoscope />
        </div>
        <div className="icon-item">
          <FaPills />
        </div>
        <div className="icon-item">
          <FaHeartbeat />
        </div>
        <div className="icon-item">
          <FaSyringe />
        </div>
        <div className="icon-item">
          <FaFlask />
        </div>
      </div>

      <div className="auth-card large">
        <img src={logo || "/placeholder.svg"} alt="Logo Doctory" className="logo-img" />
        <h2>Créer un compte</h2>
        <p>Rejoignez Doctory</p>

        <form>
          {/* ROLE */}
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="">Choisir un rôle</option>
            <option value="doctor">Docteur</option>
            <option value="patient">Patient</option>
            <option value="pharmacist">Pharmacien</option>
            <option value="admin">Admin</option>
          </select>

          {/* COMMON - NAME & EMAIL in flex row */}
          <div className="form-row">
            <input type="text" placeholder="Nom complet" required />
            <input type="email" placeholder="Email" required />
          </div>

          {/* COMMON - PHONE & GENDER in flex row */}
          <div className="form-row">
            <input type="tel" placeholder="Numéro de téléphone" required />
            {role !== "pharmacist" && (
              <select required>
                <option value="">Genre</option>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            )}
          </div>

          {/* DOCTOR */}
          {role === "doctor" && (
            <>
              <div className="form-row">
                <input type="text" placeholder="Spécialité" />
                <input type="number" placeholder="Années d'expérience" />
              </div>
              <div className="form-row">
                <input type="text" placeholder="Numéro de licence professionnelle" />
                <input type="url" placeholder="Lien du document de licence" />
              </div>
              <input type="number" placeholder="Prix de consultation" />
            </>
          )}

          {/* PATIENT */}
          {role === "patient" && <input type="date" required />}

          {/* PHARMACIST */}
          {role === "pharmacist" && (
            <>
              <div className="form-row">
                <input type="text" placeholder="Nom de la pharmacie" />
                <input type="text" placeholder="Adresse de la pharmacie" />
              </div>
              <div className="form-row">
                <input type="tel" placeholder="Téléphone de la pharmacie" />
                <input type="text" placeholder="Numéro de licence" />
              </div>
            </>
          )}

          {/* PASSWORD in flex row */}
          <div className="form-row">
            <input type="password" placeholder="Mot de passe" required />
            <input type="password" placeholder="Confirmer mot de passe" required />
          </div>

          <button type="submit">S'inscrire</button>
        </form>

        <p className="switch">
          Déjà un compte ? <a href="/signin">Se connecter</a>
        </p>
      </div>
    </div>
  )
}

export default SignUp
