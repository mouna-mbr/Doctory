import React, { useState, useEffect } from 'react';
import { FaBell, FaTrash, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../assets/css/Notifications.css';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      const response = await fetch("http://localhost:5000/api/notifications", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        setError(null);
      } else {
        setError("Impossible de charger les notifications");
      }
    } catch (err) {
      setError("Erreur lors du chargement des notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Toggle notification selection
  const toggleNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
    setSelectAll(newSelected.size === notifications.length && notifications.length > 0);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(notifications.map(n => n._id));
      setSelectedNotifications(allIds);
      setSelectAll(true);
    }
  };

  // Delete selected notification
  const deleteNotification = async (notificationId) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Cette notification sera supprimée définitivement",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6b6b',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(notifications.filter(n => n._id !== notificationId));
        selectedNotifications.delete(notificationId);
        setSelectedNotifications(new Set(selectedNotifications));
        Swal.fire({
          icon: 'success',
          title: 'Supprimée!',
          text: 'La notification a été supprimée',
          confirmButtonColor: '#1B2688',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: data.message || 'Erreur lors de la suppression',
          confirmButtonColor: '#1B2688'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la suppression de la notification',
        confirmButtonColor: '#1B2688'
      });
      console.error("Error deleting notification:", err);
    }
  };

  // Delete multiple notifications
  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.size === 0) return;

    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `${selectedNotifications.size} notification${selectedNotifications.size > 1 ? 's' : ''} seront supprimées définitivement`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff6b6b',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, supprimer tout',
      cancelButtonText: 'Annuler'
    });

    if (!result.isConfirmed) return;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      let successCount = 0;
      let errorCount = 0;

      for (const notificationId of selectedNotifications) {
        try {
          const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
          console.error("Error deleting notification:", err);
        }
      }

      // Refresh notifications list
      await fetchNotifications();
      setSelectedNotifications(new Set());
      setSelectAll(false);

      if (errorCount === 0) {
        Swal.fire({
          icon: 'success',
          title: 'Succès!',
          text: `${successCount} notification${successCount > 1 ? 's supprimées' : ' supprimée'}`,
          confirmButtonColor: '#1B2688',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Partiellement supprimé',
          text: `${successCount} supprimées, ${errorCount} erreur${errorCount > 1 ? 's' : ''}`,
          confirmButtonColor: '#1B2688'
        });
      }
    } finally {
      setDeleteLoading(false);
    }
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
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        await fetchNotifications();
        Swal.fire({
          icon: 'success',
          title: 'Succès!',
          text: 'Toutes les notifications ont été marquées comme lues',
          confirmButtonColor: '#1B2688',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du marquage des notifications',
        confirmButtonColor: '#1B2688'
      });
      console.error("Error marking all as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        {/* Header */}
        <div className="notifications-header-section">
          <div className="header-content">
            <h1>
              <FaBell /> Notifications
            </h1>
            <p className="notifications-subtitle">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && ` • ${unreadCount} non lu${unreadCount !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Actions */}
          <div className="header-actions">
            {unreadCount > 0 && (
              <button 
                className="btn btn-secondary"
                onClick={markAllAsRead}
              >
                <FaCheckCircle /> Tout marquer comme lu
              </button>
            )}
            {selectedNotifications.size > 0 && (
              <button 
                className="btn btn-danger"
                onClick={deleteSelectedNotifications}
                disabled={deleteLoading}
              >
                <FaTrash /> Supprimer sélectionnées ({selectedNotifications.size})
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}><FaTimes /></button>
          </div>
        )}

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <h2>Aucune notification</h2>
            <p>Vous n'avez pas encore de notifications</p>
          </div>
        ) : (
          <div className="notifications-list-container">
            {/* Select all checkbox */}
            <div className="select-all-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
                <span>Sélectionner tout</span>
              </label>
            </div>

            {/* Notifications */}
            {notifications.map((notification) => (
              <div 
                key={notification._id} 
                className={`notification-card ${!notification.isRead ? 'unread' : ''} ${selectedNotifications.has(notification._id) ? 'selected' : ''}`}
              >
                <div className="notification-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification._id)}
                    onChange={() => toggleNotification(notification._id)}
                  />
                </div>

                <div className="notification-card-content">
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    {!notification.isRead && (
                      <span className="unread-badge">Nouveau</span>
                    )}
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  <div className="notification-meta">
                    <span className="notification-date">
                      {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="notification-actions">
                  {!notification.isRead && (
                    <button
                      className="action-btn mark-read"
                      onClick={() => markAsRead(notification._id)}
                      title="Marquer comme lu"
                    >
                      <FaCheckCircle />
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteNotification(notification._id)}
                    title="Supprimer"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
