import { useState, useEffect } from "react";
import { FaSearch, FaEdit, FaTrash, FaEye, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "../../assets/css/UserList.css";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setFilteredUsers(data.data);
      } else {
        setError("Impossible de charger les utilisateurs");
      }
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs");
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by role
    if (roleFilter !== "ALL") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter(user => user.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter(user => !user.isActive);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.fullName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.phoneNumber?.includes(searchTerm)
        );
      });
    }

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(users.filter(user => user._id !== userId));
        alert("Utilisateur supprimé avec succès");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error("Delete user error:", err);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = currentStatus 
        ? `http://localhost:5000/api/users/${userId}/deactivate`
        : `http://localhost:5000/api/users/${userId}/activate`;
      
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers(); // Refresh the list
        alert(data.message);
      } else {
        alert("Erreur lors de la mise à jour du statut");
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour");
      console.error("Toggle status error:", err);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers(); // Refresh the list
        setShowEditModal(false);
        setSelectedUser(null);
        alert("Utilisateur mis à jour avec succès");
      } else {
        alert(data.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour");
      console.error("Update user error:", err);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const closeModals = () => {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
    setEditFormData({});
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "ADMIN":
        return "badge-admin";
      case "DOCTOR":
        return "badge-doctor";
      case "PATIENT":
        return "badge-patient";
      case "PHARMACIST":
        return "badge-pharmacist";
      default:
        return "badge-default";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "DOCTOR":
        return "Docteur";
      case "PATIENT":
        return "Patient";
      case "PHARMACIST":
        return "Pharmacien";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="user-list-container">
        <div className="loading-message">Chargement des utilisateurs...</div>
      </div>
    );
  }

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h1>Gestion des Utilisateurs</h1>
        <p>Total: {filteredUsers.length} utilisateur(s)</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        {/* Search Bar */}
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Role Filter */}
        <div className="filter-group">
          <label>Rôle:</label>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Docteur</option>
            <option value="PATIENT">Patient</option>
            <option value="PHARMACIST">Pharmacien</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label>Statut:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nom Complet</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Date d'inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td className="user-name">{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.phoneNumber}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? "status-active" : "status-inactive"}`}>
                      {user.isActive ? (
                        <>
                          <FaCheckCircle /> Actif
                        </>
                      ) : (
                        <>
                          <FaTimesCircle /> Inactif
                        </>
                      )}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-view" 
                        title="Voir détails"
                        onClick={() => handleViewUser(user)}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="btn-edit" 
                        title="Modifier"
                        onClick={() => handleEditUser(user)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className={`btn-toggle ${user.isActive ? "btn-deactivate" : "btn-activate"}`}
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        title={user.isActive ? "Désactiver" : "Activer"}
                      >
                        {user.isActive ? <FaTimesCircle /> : <FaCheckCircle />}
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDeleteUser(user._id)}
                        title="Supprimer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de l'Utilisateur</h2>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-grid">
                <div className="detail-item">
                  <label>Nom Complet:</label>
                  <p>{selectedUser.fullName}</p>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="detail-item">
                  <label>Téléphone:</label>
                  <p>{selectedUser.phoneNumber}</p>
                </div>
                <div className="detail-item">
                  <label>Rôle:</label>
                  <p>
                    <span className={`role-badge ${getRoleBadgeClass(selectedUser.role)}`}>
                      {getRoleLabel(selectedUser.role)}
                    </span>
                  </p>
                </div>
                <div className="detail-item">
                  <label>Statut:</label>
                  <p>
                    <span className={`status-badge ${selectedUser.isActive ? "status-active" : "status-inactive"}`}>
                      {selectedUser.isActive ? (
                        <>
                          <FaCheckCircle /> Actif
                        </>
                      ) : (
                        <>
                          <FaTimesCircle /> Inactif
                        </>
                      )}
                    </span>
                  </p>
                </div>
                <div className="detail-item">
                  <label>Date d'inscription:</label>
                  <p>{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="detail-item">
                  <label>Dernière mise à jour:</label>
                  <p>{new Date(selectedUser.updatedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModals}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier l'Utilisateur</h2>
              <button className="close-btn" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="fullName">Nom Complet *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={editFormData.fullName || ""}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editFormData.email || ""}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Téléphone *</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={editFormData.phoneNumber || ""}
                      onChange={handleEditFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Rôle *</label>
                    <select
                      id="role"
                      name="role"
                      value={editFormData.role || ""}
                      onChange={handleEditFormChange}
                      required
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="DOCTOR">Docteur</option>
                      <option value="PATIENT">Patient</option>
                      <option value="PHARMACIST">Pharmacien</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModals}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
