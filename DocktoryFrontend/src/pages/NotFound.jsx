"use client"
import { Link } from "react-router-dom"
import "../assets/css/NotFound.css"

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1>Page non trouvée</h1>
        <p>La page que vous cherchez n'existe pas ou a été déplacée.</p>
        
        <div className="action-buttons">
          <Link to="/" className="btn-primary">
            Retour à l'accueil
          </Link>
          <Link to="/doctors" className="btn-outline">
            Trouver un médecin
          </Link>
          <Link to="/chatbot" className="btn-outline">
            Assistant médical
          </Link>
        </div>

        <div className="quick-links">
          <h3>Liens rapides</h3>
          <div className="links-grid">
            <Link to="/signin">Connexion</Link>
            <Link to="/signup">Inscription</Link>
            <Link to="/profile">Mon profil</Link>
            <Link to="/my-appointments">Mes rendez-vous</Link>
            <Link to="/dossier">Mon dossier</Link>
            <Link to="/settings">Paramètres</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound