import React, { useState, useEffect, useRef } from 'react';
import { 
  FaBell, FaUser, FaPhone, FaSignOutAlt, FaSignInAlt, 
  FaBars, FaTimes, FaCog, FaEnvelope, FaCalendarAlt,
  FaHome, FaStethoscope, FaUserMd, FaWallet, FaMoneyBillWave, FaCreditCard
} from 'react-icons/fa';
import { MdFavorite, MdPayment } from 'react-icons/md';
import { io } from 'socket.io-client';
import '../assets/css/Navbar.css';
import logo from '../assets/photos/logonobg.png';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const socketRef = useRef(null);

  // Fetch user profile
  const fetchUserProfile = async (userId, token) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.data.profileImage) {
        setProfileImage(data.data.profileImage);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/notifications", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/notifications/unread-count", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        return <FaWallet style={{ color: '#ecf3efff' }} />;
      case 'PAYMENT_FAILED':
        return <FaCreditCard style={{ color: '#e74c3c' }} />;
      case 'PAYMENT_PENDING':
        return <FaMoneyBillWave style={{ color: '#f39c12' }} />;
      case 'PAYMENT_REFUND':
        return <FaMoneyBillWave style={{ color: '#9b59b6' }} />;
      case 'APPOINTMENT_REQUESTED':
      case 'APPOINTMENT_CONFIRMED':
      case 'APPOINTMENT_CANCELLED':
      case 'APPOINTMENT_COMPLETED':
        return <FaCalendarAlt style={{ color: '#3498db' }} />;
      default:
        return <FaBell style={{ color: '#95a5a6' }} />;
    }
  };

  // Get payment status text in French
  const getPaymentStatusText = (type) => {
    switch(type) {
      case 'PAYMENT_SUCCESS':
        return { title: 'Paiement Réussi', status: 'success' };
      case 'PAYMENT_RECEIVED':
        return { title: 'Paiement Reçu', status: 'received' };
      case 'PAYMENT_CONFIRMED':
        return { title: 'Paiement Confirmé', status: 'confirmed' };
      case 'PAYMENT_FAILED':
        return { title: 'Paiement Échoué', status: 'failed' };
      case 'PAYMENT_PENDING':
        return { title: 'Paiement en Attente', status: 'pending' };
      case 'PAYMENT_REFUND':
        return { title: 'Remboursement', status: 'refund' };
      default:
        return { title: 'Notification', status: 'info' };
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Redirect based on notification type
    if (notification.type.includes('PAYMENT')) {
      // For payment notifications, redirect to payments page
      window.location.href = '/payments';
    } else if (notification.appointmentId) {
      // For appointment notifications, redirect to appointments
      window.location.href = '/my-appointments';
    }
  };

  // Load user data from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
      fetchUserProfile(JSON.parse(userData).id, token);
      fetchNotifications();
      fetchUnreadCount();
      
      // Initialize Socket.io connection
      socketRef.current = io("http://localhost:5000", {
        auth: {
          token: token
        }
      });

      // Listen for new notifications
      socketRef.current.on("new-notification", (notification) => {
        console.log("New notification received:", notification);
        setNotifications((prev) => [notification, ...prev.slice(0, 4)]);
        
        // Show toast notification for payment notifications
        if (notification.type.includes('PAYMENT')) {
          const status = getPaymentStatusText(notification.type);
          showPaymentNotificationToast(status.title, notification.message);
        }
      });

      // Listen for unread count updates
      socketRef.current.on("unread-count-update", (count) => {
        console.log("Unread count updated:", count);
        setUnreadCount(count);
      });

      // Handle connection errors
      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, []);

  // Show payment notification toast
  const showPaymentNotificationToast = (title, message) => {
    // You can use SweetAlert2 or any other toast library
    Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      timer: 5000,
      showConfirmButton: true,
      confirmButtonText: 'Voir',
      showCancelButton: true,
      cancelButtonText: 'Fermer'
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = '/payments';
      }
    });
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const userName = user?.fullName || "Utilisateur";
  const userEmail = user?.email || "";

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    window.location.href = "/signin";
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

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

          <button 
            className="hamburger-btn mobile-only"
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
            <a href="/contact"><FaPhone /> <span>Contact</span></a>
          </nav>

          {/* Côté droit DESKTOP */}
          <div className="nav-right desktop-only">
            {/* Notifications */}
            {isLoggedIn && (
              <div className="nav-notifications">
                <button 
                  className="nav-icon-btn" 
                  aria-label="Notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <FaBell />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="mark-all-read-btn">
                          Tout marquer comme lu
                        </button>
                      )}
                    </div>
                    <div className="notifications-list">
                      {notifications.length === 0 ? (
                        <div className="no-notifications">
                          <FaBell style={{ fontSize: '48px', color: '#ccc' }} />
                          <p>Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const paymentStatus = notification.type.includes('PAYMENT') 
                            ? getPaymentStatusText(notification.type)
                            : null;
                          
                          return (
                            <div 
                              key={notification._id} 
                              className={`notification-item ${!notification.isRead ? 'unread' : ''} ${notification.type.includes('PAYMENT') ? 'payment-notification' : ''}`}
                              onClick={() => handleNotificationClick(notification)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="notification-icon">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="notification-content">
                                <h4>
                                  {paymentStatus ? paymentStatus.title : notification.title}
                                  {notification.type.includes('PAYMENT') && (
                                    <span className={`payment-status-badge status-${paymentStatus.status}`}>
                                    </span>
                                  )}
                                </h4>
                                <p>{notification.message}</p>
                                <span className="notification-time">
                                  {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {!notification.isRead && (
                                <div className="notification-unread-dot"></div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="notifications-footer">
                      <a href="/notifications">Voir toutes les notifications</a>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                        src={
                          profileImage 
                            ? `http://localhost:5000${profileImage}`
                            : `https://ui-avatars.com/api/?name=${userName}&background=1B2688&color=fff&bold=true`
                        } 
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
                            src={
                              profileImage 
                                ? `http://localhost:5000${profileImage}`
                                : `https://ui-avatars.com/api/?name=${userName}&background=1B2688&color=fff&bold=true`
                            } 
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
                        
                        <a href="/my-appointments" className="dropdown-item" onClick={closeMenu}>
                          <FaCalendarAlt />
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">Mes Rendez-vous</span>
                            <span className="dropdown-item-desc">Voir vos consultations</span>
                          </div>
                        </a>
                        
                        <a href="/security" className="dropdown-item">
                          <FaCog />
                          <div className="dropdown-item-content">
                            <span className="dropdown-item-title">Sécurité & 2FA</span>
                            <span className="dropdown-item-desc">Gérer la sécurité de votre compte</span>
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
                            <span className="dropdown-item-title">Paiements & Reçus</span>
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
                    src={
                      profileImage 
                        ? `http://localhost:5000${profileImage}`
                        : `https://ui-avatars.com/api/?name=${userName}&background=1B2688&color=fff&bold=true`
                    } 
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
                <a href="/my-appointments" className="mobile-nav-item" onClick={closeMenu}>
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
                  <span>Paiements & Reçus</span>
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
          {isLoggedIn && (
            <div className="mobile-nav-section">
              <h4 className="mobile-section-title">Notifications</h4>
              <a href="/notifications" className="mobile-nav-item notification-item" onClick={closeMenu}>
                <FaBell />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="mobile-notification-badge">{unreadCount}</span>
                )}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Overlay pour fermer le menu mobile */}
      {isMenuOpen && (
        <div className="mobile-overlay" onClick={closeMenu}></div>
      )}
    </>
  );
}