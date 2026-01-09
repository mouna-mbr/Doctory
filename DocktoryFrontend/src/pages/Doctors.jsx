"use client";

import { useState, useEffect } from "react";
import "../assets/css/Doctors.css";
import { FaStar, FaUserMd, FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaFilter, FaExclamationTriangle } from "react-icons/fa";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiSource, setApiSource] = useState(""); // Pour savoir d'où viennent les données
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour les spécialités et lieux uniques
  const [specialties, setSpecialties] = useState([]);
  const [locations, setLocations] = useState([]);

  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 Fetching doctors from API...");
      
      const token = localStorage.getItem("token");
      console.log("Token available:", !!token);
      
      // Essayer plusieurs endpoints dans l'ordre
      let doctorsData = null;
      let source = "";
      
      // ESSAI 1: Endpoint public (si vous l'avez créé)
      try {
        console.log("Trying public endpoint /api/users/doctors...");
        const response = await fetch(`${API_BASE_URL}/users/doctors`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            doctorsData = data.data;
            source = "public_api";
            console.log("✅ Success from public endpoint:", doctorsData.length, "doctors");
          }
        }
      } catch (err) {
        console.log("Public endpoint failed:", err.message);
      }
      
      // ESSAI 2: Endpoint avec authentification
      if (!doctorsData && token) {
        try {
          console.log("Trying authenticated endpoint /api/users...");
          const response = await fetch(`${API_BASE_URL}/users`, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              // Filtrer seulement les docteurs
              doctorsData = data.data.filter(user => 
                user.role === "DOCTOR" && user.isActive !== false
              );
              source = "authenticated_api";
              console.log("✅ Success from authenticated endpoint:", doctorsData.length, "doctors");
            }
          } else if (response.status === 401 || response.status === 403) {
            console.log("Authentication failed, trying without token...");
          }
        } catch (err) {
          console.log("Authenticated endpoint failed:", err.message);
        }
      }
      
      // ESSAI 3: Endpoint par rôle (peut être public)
      if (!doctorsData) {
        try {
          console.log("Trying role endpoint /api/users/role/DOCTOR...");
          const response = await fetch(`${API_BASE_URL}/users/role/DOCTOR`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              doctorsData = data.data;
              source = "role_api";
              console.log("✅ Success from role endpoint:", doctorsData.length, "doctors");
            }
          }
        } catch (err) {
          console.log("Role endpoint failed:", err.message);
        }
      }
      
      // ESSAI 4: Votre endpoint d'origine qui retourne 401
      if (!doctorsData) {
        try {
          console.log("Trying original endpoint...");
          const response = await fetch(`${API_BASE_URL}/users`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              doctorsData = data.data.filter(user => user.role === "DOCTOR");
              source = "original_api";
              console.log("✅ Success from original endpoint:", doctorsData.length, "doctors");
            }
          } else {
            console.log("Original endpoint status:", response.status);
            // Même si c'est 401, on peut extraire l'info que l'API répond
            setError(`L'API nécessite une authentification (${response.status}). Connectez-vous pour voir plus de détails.`);
            setApiSource("api_with_auth_required");
          }
        } catch (err) {
          console.log("Original endpoint failed:", err.message);
        }
      }
      
      // Traitement des données récupérées
      if (doctorsData && doctorsData.length > 0) {
        processDoctorsData(doctorsData, source);
      } else {
        // Si aucune donnée n'a été récupérée, utiliser les données mock
        console.log("No data from API, using mock data");
        const mockDoctors = getMockDoctors();
        processDoctorsData(mockDoctors, "mock");
        setError("Utilisation de données de démonstration. Les vraies données nécessitent une connexion à l'API.");
      }
      
    } catch (err) {
      console.error("❌ Error in fetchDoctors:", err);
      setError(err.message);
      
      // Fallback vers les données mock
      const mockDoctors = getMockDoctors();
      processDoctorsData(mockDoctors, "mock_fallback");
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
      rawData: doctor
    };
  };

  // Traiter les données des médecins
  const processDoctorsData = (doctorsList, source) => {
    console.log(`Processing doctors from ${source}:`, doctorsList);
    
    // Formater les données
    const formattedDoctors = doctorsList.map(formatDoctorData);
    
    setDoctors(formattedDoctors);
    setFilteredDoctors(formattedDoctors);
    setApiSource(source);
    
    // Extraire les spécialités uniques
    const uniqueSpecialties = [...new Set(formattedDoctors
      .map(doc => doc.specialty)
      .filter(specialty => specialty && specialty.trim() !== "")
    )].sort();
    
    setSpecialties(uniqueSpecialties);
    
    // Extraire les lieux uniques
    const uniqueLocations = [...new Set(formattedDoctors
      .map(doc => doc.location)
      .filter(location => location && location.trim() !== "")
    )].sort();
    
    setLocations(uniqueLocations);
    
    console.log(`✅ Processed ${formattedDoctors.length} doctors from ${source}`);
    console.log("Specialties:", uniqueSpecialties);
    console.log("Locations:", uniqueLocations);
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
  }, [searchTerm, selectedSpecialty, selectedLocation, doctors]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedSpecialty("");
    setSelectedLocation("");
  };

  const handleBookAppointment = (doctorId, doctorName) => {
    if (!localStorage.getItem("token")) {
      alert("Veuillez vous connecter pour prendre un rendez-vous");
      window.location.href = "/signin";
      return;
    }
    window.location.href = `/appointment/${doctorId}?doctor=${encodeURIComponent(doctorName)}`;
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
            {filteredDoctors.map((doctor) => (
              <div className="doctor-card" key={doctor.id}>
                <div className="doctor-photo">
                  <img src={doctor.photo} alt={doctor.name} />
                  <div className={`availability-badge ${doctor.isAvailable ? 'available' : 'unavailable'}`}>
                    {doctor.isAvailable ? '✅ Disponible' : '❌ Indisponible'}
                  </div>
                </div>

                <div className="doctor-info">
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
                      onClick={() => handleBookAppointment(doctor.id, doctor.name)}
                      disabled={!doctor.isAvailable}
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

        </>
      )}

    
    </div>
  );
};

export default Doctors;