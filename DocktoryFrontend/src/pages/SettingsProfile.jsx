import { useState } from "react";
import {
  FaCamera,
  FaUserMd,
  FaUser,
  FaClinicMedical,
} from "react-icons/fa";
import "../assets/css/SettingsProfile.css";

const SettingsProfile = () => {
  // ⚠️ Plus tard ça viendra du backend / context
  const [role] = useState("doctor"); // doctor | patient | pharmacist | admin

  const [formData, setFormData] = useState({
    fullName: "Mouna Ben Rebah",
    email: "mouna@example.com",
    phone: "22123456",
    gender: "female",
    speciality: "Cardiologue",
    experience: 5,
    consultationPrice: 80,
    pharmacyName: "",
    pharmacyAddress: "",
    birthDate: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      <form className="settings-form">
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
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Téléphone"
          />
          {role !== "pharmacist" && (
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Genre</option>
              <option value="female">Femme</option>
              <option value="male">Homme</option>
            </select>
          )}
        </div>

        {/* DOCTOR */}
        {role === "doctor" && (
          <>
            <h4 className="section-title">
              <FaUserMd /> Informations professionnelles
            </h4>
            <div className="form-row">
              <input
                name="speciality"
                value={formData.speciality}
                onChange={handleChange}
                placeholder="Spécialité"
              />
              <input
                name="experience"
                value={formData.experience}
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
        {role === "patient" && (
          <>
            <h4 className="section-title">
              <FaUser /> Informations personnelles
            </h4>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />
          </>
        )}

        {/* PHARMACIST */}
        {role === "pharmacist" && (
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

        <button className="save-btn">Enregistrer les modifications</button>
      </form>
    </div>
  );
};

export default SettingsProfile;
