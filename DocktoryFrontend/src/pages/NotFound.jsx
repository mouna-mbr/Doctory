"use client"
import { Link } from "react-router-dom"
import "../assets/css/NotFound.css"
import { FaStethoscope, FaPills, FaHeartbeat, FaSyringe, FaFlask } from "react-icons/fa"

const NotFound = () => {
  return (
    <div className="not-found-wrapper">
      
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="error-code">404</div>
          <h1>Page non trouvée</h1>
          <p>La page que vous cherchez n'existe pas ou a été déplacée.</p>
           <Link to="/" className="btn-primary">
            Retour à l'accueil
          </Link>
        </div>
        
      </div>
      

      <div className="display">
        <div className="icon-item"><FaStethoscope /></div>
        <div className="icon-item"><FaPills /></div>
        <div className="icon-item"><FaHeartbeat /></div>
        <div className="icon-item"><FaSyringe /></div>
        <div className="icon-item"><FaFlask /></div>
      </div>

    </div>
  )
}

export default NotFound
