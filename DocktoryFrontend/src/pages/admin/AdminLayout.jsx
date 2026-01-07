import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  FaHome, 
  FaUsers, 
  FaCalendarAlt,
  FaChartBar,
  FaSignOutAlt
} from "react-icons/fa";
import "../../assets/css/AdminLayout.css";
import logo from "../../assets/photos/logobgWhite.png";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen] = useState(true);

  const menuItems = [
    { id: 1, name: "Dashboard", icon: <FaHome />, path: "/admin/dashboard" },
    { id: 2, name: "Utilisateurs", icon: <FaUsers />, path: "/admin/users" },
    { id: 3, name: "Rendez-vous", icon: <FaCalendarAlt />, path: "/admin/appointments" },
    { id: 4, name: "Rapports", icon: <FaChartBar />, path: "/admin/reports" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <img src={logo} alt="Doctory Logo" className="sidebar-logo" />
          {sidebarOpen && <h3>Doctory Admin</h3>}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              title={!sidebarOpen ? item.name : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-text">{item.name}</span>}
            </button>
          ))}
        </nav>

        <button className="nav-item logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FaSignOutAlt /></span>
          {sidebarOpen && <span className="nav-text">Déconnexion</span>}
        </button>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-header">
      
          <div className="header-right">
            <div className="admin-info">
              <span className="admin-name">Admin</span>
              <span className="admin-role">Administrateur</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
