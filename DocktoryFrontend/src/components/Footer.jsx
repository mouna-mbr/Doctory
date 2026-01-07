import React from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';
import '../assets/css/Footer.css';
import logo from '../assets/photos/logobgWhite.png'; 

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="doctory-footer">
      <div className="footer-container">
        {/* Section About avec logo importé */}
        <div className="footer-section">
          <div className="footer-logo">
            <img 
              src={logo} 
              alt="Logo Doctory" 
              className="footer-logo-img"
              width="50"
              height="50"
            />
            <h3 className="footer-logo-text">Doctory</h3>
          </div>
          <p className="footer-description">
            Doctory est votre plateforme de consultation médicale en ligne de confiance. 
            Connectez-vous avec les meilleurs médecins et recevez des conseils professionnels 
            de qualité depuis le confort de votre domicile.
          </p>
          <div className="social-links">
            <a href="https://facebook.com" className="social-link" title="Facebook" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" className="social-link" title="Twitter" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
            <a href="https://linkedin.com" className="social-link" title="LinkedIn" target="_blank" rel="noopener noreferrer">
              <FaLinkedin />
            </a>
            <a href="https://instagram.com" className="social-link" title="Instagram" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* Section Links */}
        <div className="footer-section">
          <h4 className="footer-section-title">Navigation</h4>
          <ul className="footer-links">
            <li><a href="/">Accueil</a></li>
            <li><a href="/about">À propos</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/doctors">Nos Médecins</a></li>
            <li><a href="/blog">Blog</a></li>
          </ul>
        </div>

        {/* Section Services */}
        <div className="footer-section">
          <h4 className="footer-section-title">Services</h4>
          <ul className="footer-links">
            <li><a href="/consultation">Consultation en Ligne</a></li>
            <li><a href="/prescription">Prescription Médicale</a></li>
            <li><a href="/follow-up">Suivi Médical</a></li>
            <li><a href="/records">Dossier Médical</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </div>

        {/* Section Contact */}
        <div className="footer-section">
          <h4 className="footer-section-title">Contact</h4>
          <div className="contact-item">
            <FaPhone className="contact-icon" />
            <div>
              <p className="contact-label">Téléphone</p>
              <p className="contact-value">+33 1 23 45 67 89</p>
            </div>
          </div>
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <div>
              <p className="contact-label">Email</p>
              <p className="contact-value">support@doctory.fr</p>
            </div>
          </div>
          <div className="contact-item">
            <FaMapMarkerAlt className="contact-icon" />
            <div>
              <p className="contact-label">Adresse</p>
              <p className="contact-value">Paris, France</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="copyright">&copy; {currentYear} Doctory. Tous les droits réservés.</p>
          <div className="legal-links">
            <a href="/privacy">Politique de confidentialité</a>
            <span className="separator">|</span>
            <a href="/terms">Conditions d'utilisation</a>
            <span className="separator">|</span>
            <a href="/cookies">Politique des cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}