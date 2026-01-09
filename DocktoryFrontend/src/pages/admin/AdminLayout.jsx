import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaChartBar,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";
import "../../assets/css/AdminLayout.css";
import logo from "../../assets/photos/logobgWhite.png";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Fermée par défaut sur mobile
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Sur desktop, sidebar ouverte par défaut
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const menuItems = [
    { id: 1, name: "Dashboard", icon: <FaHome />, path: "/admin/dashboard" },
    { id: 2, name: "Utilisateurs", icon: <FaUsers />, path: "/admin/users" },
    { id: 3, name: "Rendez-vous", icon: <FaCalendarAlt />, path: "/admin/appointments" },
    { id: 4, name: "Rapports", icon: <FaChartBar />, path: "/admin/reports" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/signin");
    if (isMobile) setSidebarOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    // Fermer la sidebar sur mobile après avoir cliqué
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobile ? (sidebarOpen ? "open" : "") : (sidebarOpen ? "open" : "closed")}`}>
        <div className="sidebar-header">
          {isMobile && (
            <button 
              className="sidebar-toggle" 
              onClick={() => setSidebarOpen(false)}
              style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }}
            >
              <FaBars />
            </button>
          )}
          <img src={logo} alt="Doctory Logo" className="sidebar-logo" />
          <h3>Doctory Admin</h3>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </button>
          ))}
        </nav>

        <button className="nav-item logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FaSignOutAlt /></span>
          <span className="nav-text">Déconnexion</span>
        </button>
      </aside>

      {/* Overlay mobile - ferme la sidebar quand on clique dessus */}
      {isMobile && sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1500
          }}
        />
      )}

      {/* Main */}
      <div className="admin-main">
        <header className="admin-header">
          {/* Bouton hamburger pour ouvrir la sidebar sur mobile */}
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FaBars />
          </button>

          <div className="header-right">
            <div className="admin-info">
              <span className="admin-name">Admin</span>
              <span className="admin-role">Administrateur</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;