import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { FaStethoscope, FaPills, FaHeartbeat, FaSyringe, FaFlask } from "react-icons/fa"
import ReCAPTCHA from "react-google-recaptcha"
import "../assets/css/SignUp.css"
import logo from "../assets/photos/logobgWhite.png"

const SignUp = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef();
  const [role, setRole] = useState("");
  const [captchaValue, setCaptchaValue] = useState(null);
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
    consultationPrice: "",
    // Patient fields
    dateOfBirth: "",
    // Pharmacist fields
    pharmacyName: "",
    pharmacyAddress: "",
    pharmacyPhone: "",
    pharmacyLicenseNumber: ""
  });
  const [licenseFile, setLicenseFile] = useState(null);
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
    setLicenseFile(null); // Reset file when role changes
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Le fichier ne doit pas dépasser 10 MB");
        return;
      }
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError("Format de fichier invalide. Utilisez JPG, PNG ou PDF");
        return;
      }
      setLicenseFile(file);
      setError("");
    }
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

    // Validate reCAPTCHA
    if (!captchaValue) {
      setError("Veuillez compléter le reCAPTCHA");
      return;
    }

    // Validate license document for doctors and pharmacists
    if ((role === "doctor" || role === "pharmacist") && !licenseFile) {
      setError(`Le document de licence professionnelle est requis pour les ${role === "doctor" ? "docteurs" : "pharmaciens"}`);
      return;
    }

    setLoading(true);

    try {
      // Build FormData for multipart upload
      const formDataToSend = new FormData();
      
      // Add basic fields
      formDataToSend.append('role', role.toUpperCase());
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('password', formData.password);

      // Add role-specific fields
      if (role === "doctor") {
        formDataToSend.append('gender', formData.gender);
        if (formData.specialty) formDataToSend.append('specialty', formData.specialty);
        if (formData.yearsOfExperience) formDataToSend.append('yearsOfExperience', formData.yearsOfExperience);
        if (formData.licenseNumber) formDataToSend.append('licenseNumber', formData.licenseNumber);
        if (formData.consultationPrice) formDataToSend.append('consultationPrice', formData.consultationPrice);
        if (licenseFile) formDataToSend.append('licenseDocument', licenseFile);
      } else if (role === "patient") {
        formDataToSend.append('gender', formData.gender);
        if (formData.dateOfBirth) formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      } else if (role === "pharmacist") {
        if (formData.pharmacyName) formDataToSend.append('pharmacyName', formData.pharmacyName);
        if (formData.pharmacyAddress) formDataToSend.append('pharmacyAddress', formData.pharmacyAddress);
        if (formData.pharmacyPhone) formDataToSend.append('pharmacyPhone', formData.pharmacyPhone);
        if (formData.pharmacyLicenseNumber) formDataToSend.append('pharmacyLicenseNumber', formData.pharmacyLicenseNumber);
        if (licenseFile) formDataToSend.append('licenseDocument', licenseFile);
      } else if (role === "admin") {
        formDataToSend.append('gender', formData.gender);
      }

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        // Show success message about email verification
        setError("");
        alert(data.message || "Compte créé ! Veuillez vérifier votre email pour activer votre compte.");
        
        // Redirect to signin
        navigate("/signin");
      } else {
        setError(data.message || "Inscription échouée");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Une erreur s'est produite. Veuillez réessayer.");
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
                  type="number" 
                  name="consultationPrice"
                  placeholder="Prix de consultation" 
                  value={formData.consultationPrice}
                  onChange={handleChange}
                />
              </div>
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

          {/* LICENSE UPLOAD - Centered at bottom */}
          {(role === "doctor" || role === "pharmacist") && (
            <div className="file-upload-section">
              <label htmlFor="licenseUpload" className="file-upload-label">
                📄 Document de licence professionnelle * (JPG, PNG, PDF - Max 10MB)
              </label>
              <input 
                type="file" 
                id="licenseUpload"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                required
              />
              {licenseFile && <p className="file-name">✓ {licenseFile.name}</p>}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", margin: "15px 0" }}>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(value) => setCaptchaValue(value)}
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
