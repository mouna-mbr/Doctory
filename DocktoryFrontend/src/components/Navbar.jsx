import React, { useState, useEffect } from 'react';
import { 
  FaBell, FaUser, FaPhone, FaSignOutAlt, FaSignInAlt, 
  FaBars, FaTimes, FaCog, FaEnvelope, FaCalendarAlt,
  FaHome, FaStethoscope, FaUserMd
} from 'react-icons/fa';
import { MdFavorite, MdPayment } from 'react-icons/md';
import '../assets/css/Navbar.css';
import logo from '../assets/photos/logonobg.png';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userName] = useState("Mouna Ben Rebah");
  const [userEmail] = useState("Mouna@example.com");

  // Fonction simple pour basculer le menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  // Fermeture du menu mobile quand on clique sur un lien
  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // Fermer le menu en cliquant à l'extérieur (seulement pour desktop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

  // Empêcher le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="doctory-nav">
        <div className="nav-container">
          {/* Logo */}
          <a href="/" className="logo" aria-label="Doctory - Retour à l'accueil" onClick={closeMenu}>
            <img 
              src={logo} 
              alt="Logo Doctory" 
              className="logo-image"
              width="50"
              height="50"
            />
            <span className="brand">Doctory</span>
          </a>

       {/* Menu hamburger pour mobile - BOUTON SIMPLIFIÉ */}
          <button 
            className="hamburger-btn mobile-only"  // Ajoutez "mobile-only" ici
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Navigation principale DESKTOP */}
          <nav className="nav-links desktop-only">
            <a href="/"><FaHome /> <span>Accueil</span></a>
            <a href="/services"><FaStethoscope /> <span>Services</span></a>
            <a href="/doctors"><FaUserMd /> <span>Médecins</span></a>
            <a href="/contact" >
              <FaPhone /> <span>Contact</span>
            </a>
          </nav>

          {/* Côté droit DESKTOP */}
          <div className="nav-right desktop-only">
            {/* Notifications */}
            <div className="nav-notifications">
              <button className="nav-icon-btn" aria-label="Notifications">
                <FaBell />
                <span className="notification-badge">3</span>
              </button>
            </div>

            {/* Menu utilisateur DESKTOP */}
            <div className="user-menu-container">
              {!isLoggedIn ? (
                <div className="auth-buttons">
                  <a href="/login" className="signin-btn">
                    <FaSignInAlt /> <span>Se connecter</span>
                  </a>
                  <a href="/signup" className="signup-btn btn-primary">
                    <span>S'inscrire</span>
                  </a>
                </div>
              ) : (
                <>
                  <button className="user-profile-btn" onClick={toggleUserMenu}>
                    <div className="user-avatar">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${userName}&background=1B2688&color=fff&bold=true`} 
                        alt={userName} 
                      />
                    </div>
                    <span className="user-name">{userName}</span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${userName}&background=1B2688&color=fff&bold=true`} 
                            alt={userName} 
                          />
                        </div>
                        <div className="dropdown-user-info">
                          <h4>{userName}</h4>
                          <p>{userEmail}</p>
                        </div>
                      </div>
                      
                      <div className="dropdown-content">
                        <a href="/profile" className="dropdown-item" onClick={closeMenu}>
                          <FaUser />
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">Mon Profil</span>
                            <span className="dropdown-item-desc">Gérer votre compte</span>
                          </div>
                        </a>
                        
                        <a href="/appointments" className="dropdown-item" onClick={closeMenu}>
                          <FaCalendarAlt />
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">Mes Rendez-vous</span>
                            <span className="dropdown-item-desc">Voir vos consultations</span>
                          </div>
                        </a>
                        
                        <a href="/favorites" className="dropdown-item" onClick={closeMenu}>
                          <MdFavorite />
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">Favoris</span>
                            <span className="dropdown-item-desc">Médecins sauvegardés</span>
                          </div>
                        </a>
                        
                        <a href="/messages" className="dropdown-item" onClick={closeMenu}>
                          <FaEnvelope />
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">Messages</span>
                            <span className="dropdown-item-desc">Conversations</span>
                          </div>
                        </a>
                        
                        <a href="/payments" className="dropdown-item" onClick={closeMenu}>
                          <MdPayment />
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">Paiements</span>
                            <span className="dropdown-item-desc">Historique & factures</span>
                          </div>
                        </a>
                        
                        <a href="/settings" className="dropdown-item" onClick={closeMenu}>
                          <FaCog />
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">Paramètres</span>
                            <span className="dropdown-item-desc">Préférences du compte</span>
                          </div>
                        </a>
                        
                        <hr className="dropdown-divider" />
                        
                        <button className="dropdown-item logout-btn" onClick={handleLogout}>
                          <FaSignOutAlt />
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">Déconnexion</span>
                            <span className="dropdown-item-desc">Quitter votre session</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {/* En-tête */}
          <div className="mobile-menu-header">
            {isLoggedIn ? (
              <>
                <div className="mobile-user-avatar-large">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${userName}&background=1B2688&color=fff&bold=true`} 
                    alt={userName} 
                  />
                </div>
                <div className="mobile-user-info-large">
                  <h3>{userName}</h3>
                  <p>{userEmail}</p>
                </div>
              </>
            ) : (
              <div className="mobile-guest-header">
                <div className="mobile-guest-avatar">
                  <FaUser />
                </div>
                <div className="mobile-guest-info">
                  <h3>Invité</h3>
                  <p>Connectez-vous pour plus de fonctionnalités</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation mobile */}
          <div className="mobile-nav-section">
            <h4 className="mobile-section-title">Navigation</h4>
            <a href="/" className="mobile-nav-item" onClick={closeMenu}>
              <FaHome />
              <span>Accueil</span>
            </a>
            <a href="/services" className="mobile-nav-item" onClick={closeMenu}>
              <FaStethoscope />
              <span>Services</span>
            </a>
            <a href="/doctors" className="mobile-nav-item" onClick={closeMenu}>
              <FaUserMd />
              <span>Médecins</span>
            </a>
            <a href="/contact" className="mobile-nav-item" onClick={closeMenu}>
              <FaPhone />
              <span>Contact</span>
            </a>
          </div>

          {/* Compte utilisateur mobile */}
          <div className="mobile-nav-section">
            <h4 className="mobile-section-title">Mon Compte</h4>
            
            {isLoggedIn ? (
              <>
                <a href="/profile" className="mobile-nav-item" onClick={closeMenu}>
                  <FaUser />
                  <span>Mon Profil</span>
                </a>
                <a href="/appointments" className="mobile-nav-item" onClick={closeMenu}>
                  <FaCalendarAlt />
                  <span>Mes Rendez-vous</span>
                </a>
                <a href="/favorites" className="mobile-nav-item" onClick={closeMenu}>
                  <MdFavorite />
                  <span>Favoris</span>
                </a>
                <a href="/messages" className="mobile-nav-item" onClick={closeMenu}>
                  <FaEnvelope />
                  <span>Messages</span>
                </a>
                <a href="/payments" className="mobile-nav-item" onClick={closeMenu}>
                  <MdPayment />
                  <span>Paiements</span>
                </a>
                <a href="/settings" className="mobile-nav-item" onClick={closeMenu}>
                  <FaCog />
                  <span>Paramètres</span>
                </a>
                
                <div className="mobile-nav-divider"></div>
                
                <button className="mobile-nav-item logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="mobile-nav-item signin-btn" onClick={closeMenu}>
                  <FaSignInAlt />
                  <span>Se connecter</span>
                </a>
                <a href="/signup" className="mobile-nav-item signup-btn" onClick={closeMenu}>
                  <FaSignInAlt />
                  <span>S'inscrire</span>
                </a>
              </>
            )}
          </div>

          {/* Notifications mobile */}
          <div className="mobile-nav-section">
            <h4 className="mobile-section-title">Notifications</h4>
            <a href="/notifications" className="mobile-nav-item notification-item" onClick={closeMenu}>
              <FaBell />
              <span>Notifications</span>
              <span className="mobile-notification-badge">3</span>
            </a>
          </div>
        </div>
      </div>

      {/* Overlay pour fermer le menu mobile */}
      {isMenuOpen && (
        <div className="mobile-overlay" onClick={closeMenu}></div>
      )}
    </>
  );
}