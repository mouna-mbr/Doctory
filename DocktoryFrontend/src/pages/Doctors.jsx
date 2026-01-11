"use client";

import { useState, useEffect } from "react";
import "../assets/css/Doctors.css";
import { FaStar, FaUserMd, FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaFilter, FaExclamationTriangle, FaArrowLeft, FaArrowRight } from "react-icons/fa";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiSource, setApiSource] = useState("");
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour les spécialités et lieux uniques
  const [specialties, setSpecialties] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage, setDoctorsPerPage] = useState(6); // Nombre de médecins par page
  
  // États pour l'utilisateur connecté
  const [currentUser, setCurrentUser] = useState(null);

  const API_BASE_URL = "http://localhost:5000/api";

  // Decode JWT token to extract user info
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const user = await fetchCurrentUser();
      await fetchDoctors(user);
    };
    loadData();
  }, []);

  // Récupérer l'utilisateur connecté depuis le token JWT
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return null;
      }

      const decodedToken = decodeToken(token);
      
      if (decodedToken) {
        const tokenUser = {
          id: decodedToken.id,
          _id: decodedToken.id,
          role: decodedToken.role
        };
        setCurrentUser(tokenUser);
        return tokenUser;
      }
    } catch (err) {
      return null;
    }
    return null;
  };

  const fetchDoctors = async (user = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const activeUser = user || currentUser;
      const token = localStorage.getItem("token");
      
      let doctorsData = null;
      let source = "";
      
      // Endpoint public
      try {
        const response = await fetch(`${API_BASE_URL}/users/doctors`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            doctorsData = data.data;
            source = "public_api";
          }
        }
      } catch (err) {
        // Continue to next attempt
      }
      
      // Endpoint avec authentification
      if (!doctorsData && token) {
        try {
          const response = await fetch(`${API_BASE_URL}/users`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              doctorsData = data.data.filter(user => 
                user.role === "DOCTOR" && user.isActive !== false
              );
              source = "authenticated_api";
            }
          }
        } catch (err) {
          // Continue to next attempt
        }
      }
      
      // Endpoint par rôle
      if (!doctorsData) {
        try {
          const response = await fetch(`${API_BASE_URL}/users/role/DOCTOR`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              doctorsData = data.data;
              source = "role_api";
            }
          }
        } catch (err) {
          // Continue to next attempt
        }
      }
      
      // Traitement des données récupérées
      if (doctorsData && doctorsData.length > 0) {
        processDoctorsData(doctorsData, source, activeUser);
      } else {
        const mockDoctors = getMockDoctors();
        processDoctorsData(mockDoctors, "mock", activeUser);
        setError("Utilisation de données de démonstration. Les vraies données nécessitent une connexion à l'API.");
      }
      
    } catch (err) {
      setError(err.message);
      const mockDoctors = getMockDoctors();
      processDoctorsData(mockDoctors, "mock_fallback", user);
    } finally {
      setLoading(false);
    }
  };

  // Formater les données du docteur
  const formatDoctorData = (doctor) => {
    return {
      id: doctor._id || doctor.id,
      name: `Dr. ${doctor.fullName || doctor.name}`,
      specialty: doctor.specialty || "Généraliste",
      experience: doctor.yearsOfExperience || doctor.experience || 0,
      rating: doctor.rating || 4.5,
      reviews: doctor.reviewsCount || doctor.reviews || 0,
      price: doctor.consultationPrice || doctor.price || 50,
      photo: doctor.profilePicture || doctor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName || doctor.name || "Doctor")}&background=1B2688&color=fff&size=200`,
      location: doctor.location || doctor.city || "Tunis",
      phone: doctor.phoneNumber || doctor.phone || "Non disponible",
      email: doctor.email || "Non disponible",
      isAvailable: doctor.isAvailable !== false,
      description: doctor.description || doctor.bio || "Médecin professionnel",
      rawData: doctor,
      userId: doctor._id || doctor.id // Ajouter l'ID de l'utilisateur docteur
    };
  };

  // Traiter les données des médecins
  const processDoctorsData = (doctorsList, source, user = null) => {
    let formattedDoctors = doctorsList.map(formatDoctorData);
    
    const activeUser = user || currentUser;
    
    // Filtrer le docteur connecté de la liste s'il est un docteur
    if (activeUser && activeUser.role === "DOCTOR") {
      const currentUserId = activeUser._id || activeUser.id;
      
      formattedDoctors = formattedDoctors.filter(doctor => {
        const doctorId = doctor.userId;
        const doctorRawId = doctor.rawData._id || doctor.rawData.id;
        
        return doctorId !== currentUserId && doctorRawId !== currentUserId;
      });
    }
    
    setDoctors(formattedDoctors);
    setFilteredDoctors(formattedDoctors);
    setApiSource(source);
    setCurrentPage(1);
    
    const uniqueSpecialties = [...new Set(formattedDoctors
      .map(doc => doc.specialty)
      .filter(specialty => specialty && specialty.trim() !== "")
    )].sort();
    setSpecialties(uniqueSpecialties);
    
    const uniqueLocations = [...new Set(formattedDoctors
      .map(doc => doc.location)
      .filter(location => location && location.trim() !== "")
    )].sort();
    setLocations(uniqueLocations);
  };

  const getMockDoctors = () => {
    return [
      {
        _id: "696112eef7be2fdd282f0273",
        fullName: "Mouna Ben Rebah",
        specialty: "Cardiologie",
        yearsOfExperience: 8,
        rating: 4.8,
        reviewsCount: 120,
        consultationPrice: 60,
        location: "Tunis",
        phoneNumber: "55447395",
        email: "mounaaben1rebah@gmail.com",
        isAvailable: true,
        description: "Cardiologue avec 8 ans d'expérience"
      },
      {
        _id: "2",
        fullName: "Ahmed Trabelsi",
        specialty: "Dermatologie",
        yearsOfExperience: 5,
        rating: 4.6,
        reviewsCount: 90,
        consultationPrice: 50,
        location: "Sfax",
        phoneNumber: "98765432",
        email: "ahmed@example.com",
        isAvailable: true,
        description: "Spécialiste en dermatologie"
      },
      {
        _id: "3",
        fullName: "Sara Kammoun",
        specialty: "Pédiatrie",
        yearsOfExperience: 10,
        rating: 4.9,
        reviewsCount: 150,
        consultationPrice: 55,
        location: "Tunis",
        phoneNumber: "12345678",
        email: "sara@example.com",
        isAvailable: true,
        description: "Pédiatre expérimentée"
      }
    ];
  };

  // Fonction de filtrage
  useEffect(() => {
    let filtered = [...doctors];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(term) ||
        doctor.specialty.toLowerCase().includes(term) ||
        (doctor.description && doctor.description.toLowerCase().includes(term))
      );
    }
    
    if (selectedSpecialty) {
      filtered = filtered.filter(doctor => doctor.specialty === selectedSpecialty);
    }
    
    if (selectedLocation) {
      filtered = filtered.filter(doctor => doctor.location === selectedLocation);
    }
    
    setFilteredDoctors(filtered);
    setCurrentPage(1); // Réinitialiser à la page 1 quand les filtres changent
  }, [searchTerm, selectedSpecialty, selectedLocation, doctors]);

  // Fonction pour la pagination
  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSpecialty("");
    setSelectedLocation("");
    setCurrentPage(1);
  };

  const handleBookAppointment = (doctor) => {
    if (!localStorage.getItem("token")) {
      alert("Veuillez vous connecter pour prendre un rendez-vous");
      window.location.href = "/signin";
      return;
    }

    if (currentUser && currentUser.role === "DOCTOR") {
      alert("Les docteurs ne peuvent pas prendre rendez-vous avec d'autres docteurs.");
      return;
    }
    
    const encodedName = encodeURIComponent(doctor.name);
    const encodedSpecialty = encodeURIComponent(doctor.specialty);
    
    window.location.href = `/appointment/${doctor.id}?doctor=${encodedName}&specialty=${encodedSpecialty}`;
  };

  const handleLogin = () => {
    window.location.href = "/signin";
  };

  if (loading) {
    return (
      <div className="doctors-container">
        <h2 className="doctors-title">
          <FaUserMd /> Nos Médecins
        </h2>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des médecins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctors-container">
      <div className="doctors-header">
        <h2 className="doctors-title">
          <FaUserMd /> Nos Médecins
          <span className="doctors-count">({filteredDoctors.length})</span>
        </h2>
        
        {doctors.length > 0 && (
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> {showFilters ? "Masquer les filtres" : "Filtrer"}
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="stats-container">
        <div className="stat-card">
          <h4>Total médecins</h4>
          <p className="stat-number">{doctors.length}</p>
        </div>
        <div className="stat-card">
          <h4>Spécialités</h4>
          <p className="stat-number">{specialties.length}</p>
        </div>
        <div className="stat-card">
          <h4>Villes</h4>
          <p className="stat-number">{locations.length}</p>
        </div>
        <div className="stat-card">
          <h4>Prix moyen</h4>
          <p className="stat-number">
            {doctors.length > 0 
              ? Math.round(doctors.reduce((sum, doc) => sum + doc.price, 0) / doctors.length)
              : 0} DT
          </p>
        </div>
      </div>

      {/* Message d'information */}
      {error && (
        <div className={`info-message ${apiSource.includes('mock') ? 'warning' : 'info'}`}>
          <FaExclamationTriangle />
          <div>
            <p><strong>{apiSource.includes('mock') ? 'Note :' : 'Information :'}</strong> {error}</p>
            <small>
              Source des données : {apiSource === "mock" ? "Démonstration" : 
                                  apiSource === "mock_fallback" ? "Démonstration (fallback)" :
                                  apiSource === "api_with_auth_required" ? "API (auth requise)" :
                                  "API réelle"}
              {!localStorage.getItem("token") && apiSource.includes('api') && (
                <span> • <button onClick={handleLogin} className="login-link">Connectez-vous</button> pour plus de détails</span>
              )}
            </small>
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      {doctors.length > 0 && (
        <div className={`search-filters ${showFilters ? 'show' : ''}`}>
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Rechercher un médecin, une spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-grid">
            {specialties.length > 0 && (
              <div className="filter-group">
                <label><FaUserMd /> Spécialité</label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                >
                  <option value="">Toutes les spécialités</option>
                  {specialties.map((specialty, index) => (
                    <option key={index} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>
            )}

            {locations.length > 0 && (
              <div className="filter-group">
                <label><FaMapMarkerAlt /> Localisation</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">Tous les lieux</option>
                  {locations.map((location, index) => (
                    <option key={index} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-actions">
              <button className="reset-btn" onClick={resetFilters}>
                Réinitialiser
              </button>
              {(searchTerm || selectedSpecialty || selectedLocation) && (
                <span className="filter-info">
                  {filteredDoctors.length} médecin(s) trouvé(s)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

  

      {/* Liste des médecins */}
      {filteredDoctors.length === 0 ? (
        <div className="no-results">
          <FaUserMd size={48} />
          <h3>Aucun médecin trouvé</h3>
          <p>
            {doctors.length === 0 
              ? "Aucun médecin n'est actuellement disponible."
              : "Aucun médecin ne correspond à vos critères de recherche."}
          </p>
          {doctors.length > 0 && (
            <button className="reset-btn" onClick={resetFilters}>
              Voir tous les médecins
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="doctors-grid">
            {currentDoctors.map((doctor) => (
              <div className="doctor-card" key={doctor.id}>
                <div className="doctor-photo">
                  <img src={doctor.photo} alt={doctor.name} />
                  <div className={`availability-badge ${doctor.isAvailable ? 'available' : 'unavailable'}`}>
                    {doctor.isAvailable ? '✅ Disponible' : '❌ Indisponible'}
                  </div>
                </div>

                <div className="doctor-info-list">
                  <h3>{doctor.name}</h3>
                  <p className="specialty">{doctor.specialty}</p>
                  
                  <p className="doctor-location">
                    <FaMapMarkerAlt /> {doctor.location}
                  </p>

                  <p className="experience">
                    {doctor.experience} ans d'expérience
                  </p>

                  <div className="rating">
                    <FaStar />
                    <span>{doctor.rating}</span>
                    <small>({doctor.reviews} avis)</small>
                  </div>

                  <div className="price">
                    💰 {doctor.price} DT / consultation
                  </div>

                  <p className="doctor-description">
                    {doctor.description}
                  </p>

                  <div className="doctor-actions">
                    <a href={`/doctor/${doctor.id}`} className="profile-btn">
                      Voir le profil
                    </a>
                    
                    <button 
                      className="appointment-btn"
                      onClick={() => handleBookAppointment(doctor)}
                    >
                      <FaCalendarAlt /> Prendre RDV
                    </button>
                  </div>

              

                  <div className="contact-info">
                    <p>📞 {doctor.phone}</p>
                    <p>✉️ {doctor.email}</p>
                  </div>
                  
                  {doctor.rawData && apiSource.includes('api') && (
                    <div className="data-source">
                      <small>Données en temps réel</small>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Affichage {indexOfFirstDoctor + 1}-{Math.min(indexOfLastDoctor, filteredDoctors.length)} sur {filteredDoctors.length} médecins
              </div>
              
              <div className="pagination-controls">
                <button 
                  onClick={prevPage} 
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <FaArrowLeft /> Précédent
                </button>
                
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Afficher seulement quelques pages autour de la page actuelle
                      return page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 1 && page <= currentPage + 1);
                    })
                    .map((page, index, array) => {
                      // Ajouter des points de suspension si nécessaire
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <React.Fragment key={`dots-${page}`}>
                            <span className="pagination-dots">...</span>
                            <button
                              onClick={() => paginate(page)}
                              className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                </div>
                
                <button 
                  onClick={nextPage} 
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Suivant <FaArrowRight />
                </button>
              </div>
              
              {/* Sélecteur d'éléments par page */}
              <div className="per-page-selector">
                <label>Afficher : </label>
                <select
                  value={doctorsPerPage}
                  onChange={(e) => {
                    setDoctorsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={3}>3</option>
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Doctors;