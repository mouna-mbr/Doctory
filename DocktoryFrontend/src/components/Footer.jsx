import React from 'react';
import '../assets/css/Footer.css';

export default function Footer() {
  return (
    <footer className="doctory-footer">
      <div className="footer-container">
        <div className="footer-left">
          <strong>Doctory</strong>
          <div className="copyright">© {new Date().getFullYear()} Doctory. Tous droits réservés.</div>
        </div>

        <div className="footer-team">
          <div className="team-title">Équipe</div>
          <ul>
            <li>Omar — Dév Frontend</li>
            <li>Nom2 — Backend</li>
            <li>Nom3 — Design</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
