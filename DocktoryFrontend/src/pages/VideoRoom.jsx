import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaExpand,
  FaUserFriends,
  FaComment,
  FaCog,
  FaShieldAlt,
  FaClosedCaptioning,
  FaDesktop,
  FaRegClock,
  FaExclamationTriangle,
  FaTimes,
  FaCheck
} from "react-icons/fa";
import "../assets/css/VideoRoom.css";

const VideoRoom = () => {
  const { roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEndCallPopup, setShowEndCallPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [participants, setParticipants] = useState(["Médecin", "Patient"]);
  const [messages, setMessages] = useState([
    { id: 1, sender: "Système", text: "Consultation démarrée", time: "10:00" }
  ]);
  const [consultationTime, setConsultationTime] = useState(0);
  const [settings, setSettings] = useState({
    audioQuality: "high",
    videoQuality: "720p",
    enableNoiseCancellation: true,
    enableEchoCancellation: true,
    showConnectionInfo: true
  });

  // État pour suivre si l'utilisateur a interagi
  const [userInteracted, setUserInteracted] = useState(false);
  const pendingNavigationRef = useRef(null);

  const API_BASE_URL = "http://localhost:5000/api/appointments";

  // Timer pour la consultation
  useEffect(() => {
    let timer;
    if (!loading && !error) {
      timer = setInterval(() => {
        setConsultationTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading, error]);

  // Formatage du temps
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const checkAccessAndStart = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          throw new Error("Veuillez vous connecter");
        }

        const res = await fetch(`${API_BASE_URL}/room/${roomId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Accès refusé à la consultation");
        }

        // Lancer WebRTC avec meilleure qualité
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Pour la démo : utiliser le même stream
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream.clone();
        }

      } catch (err) {
        console.error("Error in video room:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAccessAndStart();

    // Fullscreen handler
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId]);

  // Gestion améliorée du beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Si une popup est ouverte, ne pas montrer la popup native
      if (showEndCallPopup || showSettingsPopup || showLeavePopup) {
        return;
      }
      
      // Si l'utilisateur a initié une navigation (comme cliquer sur un lien)
      if (pendingNavigationRef.current) {
        return;
      }
      
      // Sinon, montrer la popup native
      e.preventDefault();
      e.returnValue = "Voulez-vous vraiment quitter la consultation ?";
      return e.returnValue;
    };

    // Intercepter les clics sur les liens
    const handleClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.href && !target.href.includes('javascript')) {
        if (!showLeavePopup) {
          e.preventDefault();
          pendingNavigationRef.current = target.href;
          setShowLeavePopup(true);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, [showEndCallPopup, showSettingsPopup, showLeavePopup]);

  // Gestion de la navigation
  const handleNavigation = useCallback((url) => {
    pendingNavigationRef.current = null;
    setShowLeavePopup(false);
    window.location.href = url;
  }, []);

  // Contrôles
  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setAudioEnabled(!audioEnabled);
      setUserInteracted(true);
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(!videoEnabled);
      setUserInteracted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = document.querySelector('.video-room-container');
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setUserInteracted(true);
  };

  const handleEndCall = () => {
    setShowEndCallPopup(true);
    setUserInteracted(true);
  };

  const confirmEndCall = () => {
    // Désactiver beforeunload temporairement
    const handler = window.onbeforeunload;
    window.onbeforeunload = null;
    
    // Nettoyer les streams
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    
    // Rediriger
    window.history.back();
    
    // Restaurer le handler après un délai
    setTimeout(() => {
      window.onbeforeunload = handler;
    }, 100);
  };

  const toggleScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setUserInteracted(true);
    } catch (err) {
      console.error("Screen sharing error:", err);
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setUserInteracted(true);
  };

  const handleLeavePage = () => {
    setShowLeavePopup(true);
    setUserInteracted(true);
  };

  const handleConfirmLeave = () => {
    if (pendingNavigationRef.current) {
      handleNavigation(pendingNavigationRef.current);
    } else {
      // Nettoyer et rediriger
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      window.history.back();
    }
  };

  // Popup de confirmation personnalisée - Version stabilisée
  const CustomPopup = useCallback(({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirmer", 
    cancelText = "Annuler", 
    type = "warning",
    loading = false
  }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (isOpen) {
        // Petit délai pour l'animation
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      } else {
        setIsVisible(false);
      }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    const getIcon = () => {
      switch (type) {
        case "warning":
          return <FaExclamationTriangle className="popup-icon warning" />;
        case "info":
          return <FaShieldAlt className="popup-icon info" />;
        case "success":
          return <FaCheck className="popup-icon success" />;
        default:
          return <FaExclamationTriangle className="popup-icon warning" />;
      }
    };

    return (
      <div className={`custom-popup-overlay ${isVisible ? 'visible' : ''}`}>
        <div className="custom-popup">
          <button 
            className="popup-close-btn" 
            onClick={onClose}
            disabled={loading}
          >
            <FaTimes />
          </button>
          <div className="popup-header">
            {getIcon()}
            <h3>{title}</h3>
          </div>
          <div className="popup-body">
            <p>{message}</p>
          </div>
          <div className="popup-footer">
            <button 
              className="popup-btn cancel-btn" 
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </button>
            <button 
              className={`popup-btn confirm-btn ${type}`} 
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <span className="popup-spinner"></span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }, []);

  // Popup de paramètres stabilisée
  const SettingsPopup = useCallback(({ isOpen, onClose, settings, onSettingsChange }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (isOpen) {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      } else {
        setIsVisible(false);
      }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    return (
      <div className={`custom-popup-overlay ${isVisible ? 'visible' : ''}`}>
        <div className="custom-popup settings-popup">
          <button className="popup-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
          <div className="popup-header">
            <FaCog className="popup-icon info" />
            <h3>Paramètres de la consultation</h3>
          </div>
          <div className="popup-body settings-body">
            <div className="settings-section">
              <h4>Audio</h4>
              <div className="setting-item">
                <label>Qualité audio</label>
                <select 
                  value={settings.audioQuality}
                  onChange={(e) => onSettingsChange('audioQuality', e.target.value)}
                >
                  <option value="standard">Standard</option>
                  <option value="high">Haute qualité</option>
                  <option value="studio">Qualité studio</option>
                </select>
              </div>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox"
                    checked={settings.enableNoiseCancellation}
                    onChange={(e) => onSettingsChange('enableNoiseCancellation', e.target.checked)}
                  />
                  Réduction du bruit
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox"
                    checked={settings.enableEchoCancellation}
                    onChange={(e) => onSettingsChange('enableEchoCancellation', e.target.checked)}
                  />
                  Suppression d'écho
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h4>Vidéo</h4>
              <div className="setting-item">
                <label>Qualité vidéo</label>
                <select 
                  value={settings.videoQuality}
                  onChange={(e) => onSettingsChange('videoQuality', e.target.value)}
                >
                  <option value="360p">360p</option>
                  <option value="480p">480p</option>
                  <option value="720p">720p (Recommandé)</option>
                  <option value="1080p">1080p</option>
                </select>
              </div>
            </div>

            <div className="settings-section">
              <h4>Affichage</h4>
              <div className="setting-item">
                <label>
                  <input 
                    type="checkbox"
                    checked={settings.showConnectionInfo}
                    onChange={(e) => onSettingsChange('showConnectionInfo', e.target.checked)}
                  />
                  Afficher les informations de connexion
                </label>
              </div>
            </div>
          </div>
          <div className="popup-footer">
            <button className="popup-btn cancel-btn" onClick={onClose}>
              Annuler
            </button>
            <button className="popup-btn confirm-btn info" onClick={onClose}>
              Appliquer
            </button>
          </div>
        </div>
      </div>
    );
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="meet-logo">📹</div>
          <h1>Préparation de la consultation</h1>
          <p>Connexion à la salle: <strong>{roomId}</strong></p>
          <div className="spinner"></div>
          <div className="security-badge">
            <FaShieldAlt /> Consultation sécurisée - Chiffrée de bout en bout
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h1>Impossible de rejoindre la consultation</h1>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button 
              className="btn-primary"
              onClick={() => window.history.back()}
            >
              Retour aux rendez-vous
            </button>
            <button 
              className="btn-secondary"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="video-room-container roomvideobody">
      {/* Header */}
      <header className="meet-header">
        <div className="header-left">
          <span className="meet-logo-small">📹</span>
          <span className="meet-title">MeetConsult</span>
          <div className="room-info">
            <span className="room-name">Salle: {roomId}</span>
            <span className="timer">
              <FaRegClock /> {formatTime(consultationTime)}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button className="header-btn">
            <FaClosedCaptioning /> Sous-titres
          </button>
          <button 
            className="header-btn"
            onClick={() => setShowSettingsPopup(true)}
          >
            <FaCog /> Paramètres
          </button>
          <div className="security-indicator">
            <FaShieldAlt /> Sécurisé
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="meet-main">
        {/* Video Grid */}
        <div className="video-grid">
          {/* Remote Video (Main) */}
          <div className={`video-tile ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="video-header">
              <span className="participant-name">Médecin/Patient</span>
              <span className="video-status">
                {audioEnabled ? '🎤' : '🔇'} {videoEnabled ? '📹' : '📷❌'}
              </span>
            </div>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="video-element"
            />
            <div className="video-overlay">
              <span className="connection-status">● Connecté</span>
            </div>
          </div>

          {/* Local Video (PiP) */}
          <div className="local-video-pip">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="pip-element"
            />
            <div className="pip-overlay">
              <span>Vous {!videoEnabled && ' (caméra désactivée)'}</span>
            </div>
          </div>
        </div>

        {/* Side Panels */}
        {showParticipants && (
          <div className="side-panel participants-panel">
            <div className="panel-header">
              <h3>
                <FaUserFriends /> Participants ({participants.length})
              </h3>
              <button 
                className="close-panel"
                onClick={() => setShowParticipants(false)}
              >
                ×
              </button>
            </div>
            <div className="participants-list">
              {participants.map((participant, index) => (
                <div key={index} className="participant-item">
                  <div className="participant-avatar">
                    {participant.charAt(0)}
                  </div>
                  <div className="participant-info">
                    <span className="participant-name">{participant}</span>
                    <span className="participant-status">● En ligne</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showChat && (
          <div className="side-panel chat-panel">
            <div className="panel-header">
              <h3><FaComment /> Chat</h3>
              <button 
                className="close-panel"
                onClick={() => setShowChat(false)}
              >
                ×
              </button>
            </div>
            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className="message">
                  <span className="message-sender">{msg.sender}:</span>
                  <span className="message-text">{msg.text}</span>
                  <span className="message-time">{msg.time}</span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input 
                type="text" 
                placeholder="Écrire un message..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    const newMessage = {
                      id: messages.length + 1,
                      sender: "Vous",
                      text: e.target.value,
                      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    };
                    setMessages([...messages, newMessage]);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Control Bar */}
      <footer className="meet-controls">
        <div className="controls-left">
          <div className="call-info">
            <span className="call-status">● Consultation en cours</span>
            <span className="call-timer">
              <FaRegClock /> {formatTime(consultationTime)}
            </span>
          </div>
        </div>

        <div className="controls-center">
          <button 
            className={`control-btn ${!audioEnabled ? 'active' : ''}`}
            onClick={toggleAudio}
            title={audioEnabled ? "Désactiver le micro" : "Activer le micro"}
          >
            {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>

          <button 
            className="control-btn end-call"
            onClick={handleEndCall}
            title="Terminer l'appel"
          >
            <FaPhoneSlash />
          </button>

          <button 
            className={`control-btn ${!videoEnabled ? 'active' : ''}`}
            onClick={toggleVideo}
            title={videoEnabled ? "Désactiver la caméra" : "Activer la caméra"}
          >
            {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </button>

          <button 
            className="control-btn"
            onClick={toggleScreenShare}
            title="Partager l'écran"
          >
            <FaDesktop />
          </button>

          <button 
            className="control-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            <FaExpand />
          </button>
        </div>

        <div className="controls-right">
          <button 
            className={`control-btn ${showParticipants ? 'active' : ''}`}
            onClick={() => setShowParticipants(!showParticipants)}
            title="Participants"
          >
            <FaUserFriends /> {participants.length}
          </button>

          <button 
            className={`control-btn ${showChat ? 'active' : ''}`}
            onClick={() => setShowChat(!showChat)}
            title="Chat"
          >
            <FaComment />
          </button>

          <button 
            className="control-btn settings"
            onClick={() => setShowSettingsPopup(true)}
            title="Paramètres"
          >
            <FaCog />
          </button>
        </div>
      </footer>

      {/* Popups personnalisées */}
      <CustomPopup
        isOpen={showEndCallPopup}
        onClose={() => setShowEndCallPopup(false)}
        onConfirm={confirmEndCall}
        title="Terminer la consultation"
        message="Êtes-vous sûr de vouloir terminer cette consultation ? Cette action est irréversible."
        confirmText="Terminer"
        cancelText="Continuer"
        type="warning"
      />

      <CustomPopup
        isOpen={showLeavePopup}
        onClose={() => setShowLeavePopup(false)}
        onConfirm={handleConfirmLeave}
        title="Quitter la consultation"
        message="Vous êtes sur le point de quitter la consultation en cours. Souhaitez-vous vraiment quitter ?"
        confirmText="Quitter"
        cancelText="Rester"
        type="warning"
      />

      <SettingsPopup
        isOpen={showSettingsPopup}
        onClose={() => setShowSettingsPopup(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
};

export default VideoRoom;