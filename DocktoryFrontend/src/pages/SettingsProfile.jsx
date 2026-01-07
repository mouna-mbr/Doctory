import { useState, useEffect } from "react";
import {
  FaCamera,
  FaUserMd,
  FaUser,
  FaClinicMedical,
} from "react-icons/fa";
import "../assets/css/SettingsProfile.css";

const SettingsProfile = () => {
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    specialty: "",
    yearsOfExperience: "",
    consultationPrice: "",
    pharmacyName: "",
    pharmacyAddress: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        
        if (!token || !userData) {
          window.location.href = "/signin";
          return;
        }

        const userInfo = JSON.parse(userData);
        setUserId(userInfo.id);
        setRole(userInfo.role);
        
        const response = await fetch(`http://localhost:5000/api/users/${userInfo.id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          const user = data.data;
          setFormData({
            fullName: user.fullName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            gender: user.gender || "",
            specialty: user.specialty || "",
            yearsOfExperience: user.yearsOfExperience || "",
            consultationPrice: user.consultationPrice || "",
            pharmacyName: user.pharmacyName || "",
            pharmacyAddress: user.pharmacyAddress || "",
            dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setMessage("Erreur lors du chargement du profil");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Profil mis à jour avec succès!");
        // Update localStorage
        const userData = JSON.parse(localStorage.getItem("user"));
        userData.fullName = formData.fullName;
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setMessage(data.message || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Update error:", err);
      setMessage("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-container">Chargement...</div>;
  }

  return (
    <div className="settings-container">
      <h2 className="settings-title">Paramètres du profil</h2>

      {/* PHOTO */}
      <div className="profile-photo-section">
        <div className="photo-wrapper">
          <img
            src={`https://ui-avatars.com/api/?name=${formData.fullName}&background=1B2688&color=fff&size=200`}
            alt="Profile"
          />
          <label className="upload-btn">
            <FaCamera />
            <input type="file" hidden />
          </label>
        </div>
      </div>

      {/* FORM */}
      {message && <div className={`message ${message.includes('succès') ? 'success' : 'error'}`}>{message}</div>}
      
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Nom complet"
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
          />
        </div>

        <div className="form-row">
          <input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Téléphone"
          />
          {role !== "PHARMACIST" && (
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Genre</option>
              <option value="female">Femme</option>
              <option value="male">Homme</option>
            </select>
          )}
        </div>

        {/* DOCTOR */}
        {role === "DOCTOR" && (
          <>
            <h4 className="section-title">
              <FaUserMd /> Informations professionnelles
            </h4>
            <div className="form-row">
              <input
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                placeholder="Spécialité"
              />
              <input
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                placeholder="Années d'expérience"
                type="number"
              />
            </div>
            <input
              name="consultationPrice"
              value={formData.consultationPrice}
              onChange={handleChange}
              placeholder="Prix consultation (DT)"
              type="number"
            />
          </>
        )}

        {/* PATIENT */}
        {role === "PATIENT" && (
          <>
            <h4 className="section-title">
              <FaUser /> Informations personnelles
            </h4>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </>
        )}

        {/* PHARMACIST */}
        {role === "PHARMACIST" && (
          <>
            <h4 className="section-title">
              <FaClinicMedical /> Pharmacie
            </h4>
            <input
              name="pharmacyName"
              placeholder="Nom de la pharmacie"
              onChange={handleChange}
            />
            <input
              name="pharmacyAddress"
              placeholder="Adresse de la pharmacie"
              onChange={handleChange}
            />
          </>
        )}

        <button className="save-btn" type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
};

export default SettingsProfile;
