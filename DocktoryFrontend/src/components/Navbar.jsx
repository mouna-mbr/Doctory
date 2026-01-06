import React, { useState } from 'react';
import '../assets/css/Navbar.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="doctory-nav">
      <div className="nav-container">
        <a className="logo" href="/" aria-label="Doctory">
          <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <circle cx="50" cy="50" r="50" fill="#1B2688" />
            <text x="50%" y="55%" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="48" fill="#ffffff" fontWeight="700">D</text>
          </svg>
          <span className="brand">Doctory</span>
        </a>

        <button
          className="nav-toggle"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOpen(!open)}
        >
          <span className={`hamburger ${open ? 'open' : ''}`}></span>
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Navigation principale">
          <a href="/">Accueil</a>
          <a href="/services">Services</a>
          <a href="/team">Équipe</a>
          <a href="/contact" className="btn-primary">Contact</a>
        </nav>
      </div>
    </header>
  );
}