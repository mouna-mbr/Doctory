import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaStethoscope, FaPills, FaHeartbeat, FaSyringe, FaFlask } from "react-icons/fa"
import "../assets/css/SignUp.css"
import logo from "../assets/photos/logobgWhite.png"

const SignUp = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    password: "",
    confirmPassword: "",
    // Doctor fields
    specialty: "",
    yearsOfExperience: "",
    licenseNumber: "",
    licenseDocumentUrl: "",
    consultationPrice: "",
    // Patient fields
    dateOfBirth: "",
    // Pharmacist fields
    pharmacyName: "",
    pharmacyAddress: "",
    pharmacyPhone: "",
    pharmacyLicenseNumber: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      // Build request payload based on role
      const payload = {
        role: role.toUpperCase(),
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      };

      // Add role-specific fields
      if (role === "doctor") {
        payload.gender = formData.gender;
        if (formData.specialty) payload.specialty = formData.specialty;
        if (formData.yearsOfExperience) payload.yearsOfExperience = parseInt(formData.yearsOfExperience);
        if (formData.licenseNumber) payload.licenseNumber = formData.licenseNumber;
        if (formData.licenseDocumentUrl) payload.licenseDocumentUrl = formData.licenseDocumentUrl;
        if (formData.consultationPrice) payload.consultationPrice = parseFloat(formData.consultationPrice);
      } else if (role === "patient") {
        payload.gender = formData.gender;
        if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      } else if (role === "pharmacist") {
        if (formData.pharmacyName) payload.pharmacyName = formData.pharmacyName;
        if (formData.pharmacyAddress) payload.pharmacyAddress = formData.pharmacyAddress;
        if (formData.pharmacyPhone) payload.pharmacyPhone = formData.pharmacyPhone;
        if (formData.pharmacyLicenseNumber) payload.pharmacyLicenseNumber = formData.pharmacyLicenseNumber;
      } else if (role === "admin") {
        payload.gender = formData.gender;
      }

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user info in localStorage
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        
        // Redirect to home or dashboard
        navigate("/");
      } else {
        setError(data.message || "Inscription échouée");
      }
    } catch (err) {
      setError("Une erreur s'est produite. Veuillez réessayer.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="medical-icons-bg">
        <div className="icon-item">
          <FaStethoscope />
        </div>
        <div className="icon-item">
          <FaPills />
        </div>
        <div className="icon-item">
          <FaHeartbeat />
        </div>
        <div className="icon-item">
          <FaSyringe />
        </div>
        <div className="icon-item">
          <FaFlask />
        </div>
      </div>

      <div className="auth-card large">
        <img src={logo || "/placeholder.svg"} alt="Logo Doctory" className="logo-img" />
        <h2>Créer un compte</h2>
        <p>Rejoignez Doctory</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* ROLE */}
          <select value={role} onChange={handleRoleChange} required>
            <option value="">Choisir un rôle</option>
            <option value="doctor">Docteur</option>
            <option value="patient">Patient</option>
            <option value="pharmacist">Pharmacien</option>
            <option value="admin">Admin</option>
          </select>

          {/* COMMON - NAME & EMAIL in flex row */}
          <div className="form-row">
            <input 
              type="text" 
              name="fullName"
              placeholder="Nom complet" 
              value={formData.fullName}
              onChange={handleChange}
              required 
            />
            <input 
              type="email" 
              name="email"
              placeholder="Email" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>

          {/* COMMON - PHONE & GENDER in flex row */}
          <div className="form-row">
            <input 
              type="tel" 
              name="phoneNumber"
              placeholder="Numéro de téléphone" 
              value={formData.phoneNumber}
              onChange={handleChange}
              required 
            />
            {role !== "pharmacist" && (
              <select 
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Genre</option>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            )}
          </div>

          {/* DOCTOR */}
          {role === "doctor" && (
            <>
              <div className="form-row">
                <input 
                  type="text" 
                  name="specialty"
                  placeholder="Spécialité" 
                  value={formData.specialty}
                  onChange={handleChange}
                />
                <input 
                  type="number" 
                  name="yearsOfExperience"
                  placeholder="Années d'expérience" 
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <input 
                  type="text" 
                  name="licenseNumber"
                  placeholder="Numéro de licence professionnelle" 
                  value={formData.licenseNumber}
                  onChange={handleChange}
                />
                <input 
                  type="url" 
                  name="licenseDocumentUrl"
                  placeholder="Lien du document de licence" 
                  value={formData.licenseDocumentUrl}
                  onChange={handleChange}
                />
              </div>
              <input 
                type="number" 
                name="consultationPrice"
                placeholder="Prix de consultation" 
                value={formData.consultationPrice}
                onChange={handleChange}
              />
            </>
          )}

          {/* PATIENT */}
          {role === "patient" && (
            <input 
              type="date" 
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required 
            />
          )}

          {/* PHARMACIST */}
          {role === "pharmacist" && (
            <>
              <div className="form-row">
                <input 
                  type="text" 
                  name="pharmacyName"
                  placeholder="Nom de la pharmacie" 
                  value={formData.pharmacyName}
                  onChange={handleChange}
                />
                <input 
                  type="text" 
                  name="pharmacyAddress"
                  placeholder="Adresse de la pharmacie" 
                  value={formData.pharmacyAddress}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <input 
                  type="tel" 
                  name="pharmacyPhone"
                  placeholder="Téléphone de la pharmacie" 
                  value={formData.pharmacyPhone}
                  onChange={handleChange}
                />
                <input 
                  type="text" 
                  name="pharmacyLicenseNumber"
                  placeholder="Numéro de licence" 
                  value={formData.pharmacyLicenseNumber}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* PASSWORD in flex row */}
          <div className="form-row">
            <input 
              type="password" 
              name="password"
              placeholder="Mot de passe" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="Confirmer mot de passe" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>

        <p className="switch">
          Déjà un compte ? <a href="/signin">Se connecter</a>
        </p>
      </div>
    </div>
  )
}

export default SignUp
