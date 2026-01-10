import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import AppointmentBooking from "./AppointmentBooking";
import "../assets/css/AppointmentPage.css";

const AppointmentPage = () => {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:5000/api";

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        setLoading(true);
        setDoctor(null);
        setError(null);
        
        console.log("🔍 Fetching doctor info for ID:", doctorId);
        
        // Récupérer les paramètres de l'URL
        const doctorNameFromUrl = searchParams.get('doctor');
        const doctorSpecialtyFromUrl = searchParams.get('specialty');
        
        console.log("URL params - Name:", doctorNameFromUrl, "Specialty:", doctorSpecialtyFromUrl);
        
        // D'abord essayer l'API avec authentification
        try {
          const token = localStorage.getItem("token");
          console.log("Token exists:", !!token);
          
          if (token) {
            const response = await fetch(`${API_BASE_URL}/users/doctors/${doctorId}`, {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              }
            });
            
            console.log("API response status:", response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log("API response data:", data);
              
              if (data.success && data.data) {
                // Formater les données du médecin
                const formattedDoctor = {
                  id: data.data._id || doctorId,
                  name: data.data.fullName ? `Dr. ${data.data.fullName}` : (doctorNameFromUrl || "Médecin"),
                  specialty: data.data.specialty || doctorSpecialtyFromUrl || "Généraliste"
                };
                console.log("✅ Doctor info from API:", formattedDoctor);
                setDoctor(formattedDoctor);
                setLoading(false);
                return;
              }
            }
          }
        } catch (apiError) {
          console.log("API fetch error:", apiError);
          // Continue avec fallback
        }
        
        // Fallback: utiliser les paramètres de l'URL
        console.log("🔄 Using URL params as fallback");
        const fallbackDoctor = {
          id: doctorId,
          name: doctorNameFromUrl || "Dr. Inconnu",
          specialty: doctorSpecialtyFromUrl || "Généraliste"
        };
        console.log("Fallback doctor:", fallbackDoctor);
        setDoctor(fallbackDoctor);
        
      } catch (err) {
        console.error("❌ Error fetching doctor info:", err);
        setError(err.message);
        
        // Dernier recours: utiliser seulement l'ID
        setDoctor({
          id: doctorId,
          name: "Dr. Inconnu",
          specialty: "Généraliste"
        });
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctorInfo();
    } else {
      setError("ID du médecin manquant");
      setLoading(false);
    }
  }, [doctorId, searchParams]);

  if (loading) {
    return (
      <div className="appointment-page-loading">
        <div className="spinner"></div>
        <p>Chargement des informations du médecin...</p>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="appointment-page-error">
        <h2>Erreur de chargement</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/doctors')}>
          Retour à la liste des médecins
        </button>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="appointment-page-error">
        <h2>Médecin non trouvé</h2>
        <p>Impossible de charger les informations du médecin.</p>
        <button onClick={() => navigate('/doctors')}>
          Retour à la liste des médecins
        </button>
      </div>
    );
  }

  return (
    <AppointmentBooking 
      doctorId={doctor.id}
      doctorName={doctor.name}
      doctorSpecialty={doctor.specialty}
      onBack={() => navigate('/doctors')}
    />
  );
};

export default AppointmentPage;