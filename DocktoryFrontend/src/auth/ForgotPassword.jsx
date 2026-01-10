import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStethoscope, FaPills, FaHeartbeat, FaSyringe, FaFlask, FaArrowLeft } from "react-icons/fa";
import Swal from "sweetalert2";
import "../assets/css/SignIn.css";
import logo from "../assets/photos/logobgWhite.png";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "http://localhost:5000/api";

  // Step 1: Request reset code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Code envoyé !",
          text: "Un code de réinitialisation a été envoyé à votre email.",
          confirmButtonColor: "#27ae60",
        });
        setStep(2);
      } else {
        Swal.fire({
          icon: "info",
          title: "Email envoyé",
          text: data.message,
          confirmButtonColor: "#3498db",
        });
        setStep(2);
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Une erreur est survenue. Veuillez réessayer.",
        confirmButtonColor: "#e74c3c",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Code vérifié !",
          text: "Vous pouvez maintenant changer votre mot de passe.",
          confirmButtonColor: "#27ae60",
          timer: 2000,
        });
        setStep(3);
      } else {
        Swal.fire({
          icon: "error",
          title: "Code invalide",
          text: data.message || "Le code est incorrect ou a expiré.",
          confirmButtonColor: "#e74c3c",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Une erreur est survenue. Veuillez réessayer.",
        confirmButtonColor: "#e74c3c",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Attention",
        text: "Les mots de passe ne correspondent pas.",
        confirmButtonColor: "#f39c12",
      });
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Attention",
        text: "Le mot de passe doit contenir au moins 6 caractères.",
        confirmButtonColor: "#f39c12",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Mot de passe réinitialisé !",
          text: "Votre mot de passe a été changé avec succès.",
          confirmButtonColor: "#27ae60",
          timer: 3000,
        }).then(() => {
          navigate("/signin");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: data.message || "Échec de la réinitialisation.",
          confirmButtonColor: "#e74c3c",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Une erreur est survenue. Veuillez réessayer.",
        confirmButtonColor: "#e74c3c",
      });
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

      <div className="auth-card">
        <img src={logo} alt="Logo Doctory" className="logo-img" />
        
        {/* Back button */}
        <button
          className="back-button"
          onClick={() => {
            if (step === 1) {
              navigate("/signin");
            } else {
              setStep(step - 1);
            }
          }}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "transparent",
            border: "none",
            color: "#2c3e50",
            cursor: "pointer",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaArrowLeft />
        </button>

        <h2>Mot de passe oublié</h2>
        
        {/* Step 1: Email */}
        {step === 1 && (
          <>
            <p>Entrez votre email pour recevoir un code de réinitialisation</p>
            <form onSubmit={handleRequestCode}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer le code"}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Code verification */}
        {step === 2 && (
          <>
            <p>Entrez le code à 6 chiffres envoyé à {email}</p>
            <form onSubmit={handleVerifyCode}>
              <input
                type="text"
                placeholder="Code de vérification"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
                style={{ textAlign: "center", letterSpacing: "5px", fontSize: "24px" }}
              />
              <button type="submit" disabled={loading}>
                {loading ? "Vérification..." : "Vérifier le code"}
              </button>
              <p className="switch">
                Code non reçu ?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRequestCode(e);
                  }}
                >
                  Renvoyer
                </a>
              </p>
            </form>
          </>
        )}

        {/* Step 3: New password */}
        {step === 3 && (
          <>
            <p>Choisissez un nouveau mot de passe</p>
            <form onSubmit={handleResetPassword}>
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              </button>
            </form>
          </>
        )}

        <p className="switch">
          <a href="/signin">Retour à la connexion</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
