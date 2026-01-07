"use client";

import { useState } from "react";
import {
  FaFileMedical,
  FaFilePdf,
  FaXRay,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaUser,
  FaEye,
  FaStethoscope,
  FaHeartbeat,
  FaFolder,
  FaFileAlt,
} from "react-icons/fa";
import "../assets/css/Dossier.css";

const Dossier = ({ user }) => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});

  // Détermine le rôle (par défaut "patient" pour l'exemple)
  const role = user?.role || "patient"; // doctor | patient | pharmacist

  // Données d'exemple enrichies
  const data =
    role === "patient"
      ? [
          {
            specialty: "Cardiologie",
            icon: <FaHeartbeat />,
            color: "linear-gradient(45deg, rgb(4, 159, 187) 0%, rgb(80, 246, 255) 100%)",
            dossiers: [
              {
                date: "2026-01-10",
                type: "Scanner",
                files: ["scanner1.pdf", "scanner2.pdf"],
                doctorRemark: "Suivi tension OK",
                state: "Terminé",
              },
              {
                date: "2026-02-01",
                type: "Fiche",
                files: ["fiche.pdf"],
                doctorRemark: "Recommandation : sport léger",
                state: "En cours",
              },
            ],
          },
          {
            specialty: "Radiologie",
            icon: <FaXRay />,
            color: "linear-gradient(45deg, rgb(255, 152, 0) 0%, rgb(255, 193, 7) 100%)",
            dossiers: [
              {
                date: "2026-03-05",
                type: "Radio",
                files: ["radio1.jpg"],
                doctorRemark: "Fracture légère",
                state: "Terminé",
              },
            ],
          },
          {
            specialty: "Neurologie",
            icon: <FaFileMedical />,
            color: "linear-gradient(45deg, rgb(156, 39, 176) 0%, rgb(233, 30, 99) 100%)",
            dossiers: [
              {
                date: "2026-04-15",
                type: "Scanner",
                files: ["scan_cerebral.pdf"],
                doctorRemark: "Examen normal",
                state: "Terminé",
              },
            ],
          },
        ]
      : [
          {
            patientName: "John Doe",
            patientInitials: "JD",
            specialty: "Cardiologie",
            lastVisit: "2026-02-01",
            color: "linear-gradient(45deg, rgb(4, 159, 187) 0%, rgb(80, 246, 255) 100%)",
            dossiers: [
              {
                date: "2026-01-10",
                type: "Scanner",
                files: ["scanner1.pdf"],
                doctorRemark: "Suivi tension OK",
                patientComment: "Aucune douleur",
                state: "Terminé",
              },
              {
                date: "2026-02-01",
                type: "Fiche",
                files: ["fiche.pdf"],
                doctorRemark: "Sport léger",
                patientComment: "Bien compris",
                state: "En cours",
              },
            ],
          },
          {
            patientName: "Jane Smith",
            patientInitials: "JS",
            specialty: "Radiologie",
            lastVisit: "2026-03-05",
            color: "linear-gradient(45deg, rgb(255, 152, 0) 0%, rgb(255, 193, 7) 100%)",
            dossiers: [
              {
                date: "2026-03-05",
                type: "Radio",
                files: ["radio1.jpg"],
                doctorRemark: "Fracture légère",
                patientComment: "Douleur faible",
                state: "Terminé",
              },
            ],
          },
        ];

  const toggleExpand = (index) => {
    setExpanded({ ...expanded, [index]: !expanded[index] });
  };

  const filteredData = data.filter((item) => {
    if (role === "patient") {
      return item.specialty.toLowerCase().includes(search.toLowerCase());
    } else {
      return (
        item.patientName.toLowerCase().includes(search.toLowerCase()) ||
        item.specialty.toLowerCase().includes(search.toLowerCase())
      );
    }
  });

  // Fonction pour obtenir l'initiale d'un nom
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="dossier-container">
      <h2>📂 {role === "patient" ? "Mes Dossiers" : "Dossiers Patients"}</h2>

      {/* Recherche */}
      <div className="dossier-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder={
            role === "patient"
              ? "Rechercher par spécialité..."
              : "Rechercher par patient..."
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>



      <div className="dossier-list">
        {filteredData.length === 0 && (
          <p className="no-dossier">Aucun dossier trouvé</p>
        )}

        {filteredData.map((item, index) => (
          <div
            className="dossier-card-container"
            key={index}
            data-role={role}
          >
            {role === "patient" ? (
              // Vue patient : carte de spécialité
              <div className="card-dossier dossier-card">
                <div className="top-section" style={{ background: item.color }}>
                  <div className="border"></div>
                  <div className="card-header">
                    <div className="card-icon">{item.icon}</div>
                    <h3 className="card-title">{item.specialty}</h3>
                  </div>
                </div>
                
                <div className="bottom-section">
                  <div className="stats-row">
                    <div className="stat-item">
                      <span className="big-text">{item.dossiers.length}</span>
                      <span className="regular-text">Dossiers</span>
                    </div>
                    <div className="stat-item">
                      <span className="big-text">
                        {item.dossiers.filter(d => d.state === "Terminé").length}
                      </span>
                      <span className="regular-text">Terminés</span>
                    </div>
                    <div className="stat-item">
                      <span className="big-text">
                        {item.dossiers.filter(d => d.state === "En cours").length}
                      </span>
                      <span className="regular-text">En cours</span>
                    </div>
                  </div>
                  
                  <button 
                    className="view-details-btn"
                    onClick={() => toggleExpand(index)}
                  >
                    {expanded[index] ? (
                      <>
                        <FaChevronUp /> Masquer les détails
                      </>
                    ) : (
                      <>
                        <FaChevronDown /> Voir les détails
                      </>
                    )}
                  </button>
                </div>
                
                {expanded[index] && (
                  <div className="dossier-details">
                    <div className="dossier-details-content">
                      {item.dossiers
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((dossier, i) => (
                          <div className="dossier-item" key={i}>
                            <div className="dossier-item-header">
                              <span className="dossier-date">
                                <FaFileAlt /> {dossier.date}
                              </span>
                              <span className={`dossier-state ${dossier.state.toLowerCase().replace("é", "e")}`}>
                                {dossier.state}
                              </span>
                            </div>
                            <div className="dossier-type">
                              {dossier.type === "Fiche" && <FaFileMedical />}
                              {dossier.type === "Scanner" && <FaFilePdf />}
                              {dossier.type === "Radio" && <FaXRay />}
                              <span>{dossier.type}</span>
                            </div>
                            <p className="doctor-remark">
                              <strong>Remarque médecin :</strong> {dossier.doctorRemark}
                            </p>
                            <div className="dossier-files">
                              {dossier.files.map((f, idx) => (
                                <span className="file-item" key={idx}>
                                  📄 {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Vue docteur : carte patient
              <div className="card-dossier doctor-patient-card">
                <div className="top-section" style={{ background: item.color }}>
                  <div className="border"></div>
                  <div className="card-header">
                    <div className="patient-avatar">
                      {item.patientInitials || getInitials(item.patientName)}
                    </div>
                    <div className="patient-info-header">
                      <h3 className="card-title">{item.patientName}</h3>
                      <p className="patient-specialty">
                        <FaStethoscope /> {item.specialty}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bottom-section">
                  <div className="stats-row">
                    <div className="stat-item">
                      <span className="big-text">{item.dossiers.length}</span>
                      <span className="regular-text">Dossiers</span>
                    </div>
                    <div className="stat-item">
                      <span className="big-text">{item.lastVisit}</span>
                      <span className="regular-text">Dernière visite</span>
                    </div>
                    <div className="stat-item">
                      <span className="big-text">
                        {item.dossiers.filter(d => d.state === "Terminé").length}
                      </span>
                      <span className="regular-text">Terminés</span>
                    </div>
                  </div>
                  
                  <div className="action-buttons">
                    <button 
                      className="view-details-btn"
                      onClick={() => toggleExpand(index)}
                    >
                      {expanded[index] ? (
                        <>
                          <FaChevronUp /> Masquer les dossiers
                        </>
                      ) : (
                        <>
                          <FaChevronDown /> Voir les dossiers
                        </>
                      )}
                    </button>
                    <button className="view-full-dossier-btn">
                      <FaEye /> Dossier complet
                    </button>
                  </div>
                </div>
                
                {expanded[index] && (
                  <div className="dossier-details">
                    <div className="dossier-details-content">
                      {item.dossiers
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((dossier, i) => (
                          <div className="dossier-item" key={i}>
                            <div className="dossier-item-header">
                              <span className="dossier-date">
                                <FaFileAlt /> {dossier.date}
                              </span>
                              <span className={`dossier-state ${dossier.state.toLowerCase().replace("é", "e")}`}>
                                {dossier.state}
                              </span>
                            </div>
                            <div className="dossier-type">
                              {dossier.type === "Fiche" && <FaFileMedical />}
                              {dossier.type === "Scanner" && <FaFilePdf />}
                              {dossier.type === "Radio" && <FaXRay />}
                              <span>{dossier.type}</span>
                            </div>
                            <div className="dossier-comments">
                              <p className="doctor-remark">
                                <strong>Médecin :</strong> {dossier.doctorRemark}
                              </p>
                              {dossier.patientComment && (
                                <p className="patient-comment">
                                  <strong>Patient :</strong> {dossier.patientComment}
                                </p>
                              )}
                            </div>
                            <div className="dossier-files">
                              {dossier.files.map((f, idx) => (
                                <span className="file-item" key={idx}>
                                  📄 {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dossier;