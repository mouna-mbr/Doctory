import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { FaStethoscope, FaPills, FaHeartbeat, FaSyringe, FaFlask } from "react-icons/fa"
import "../assets/css/SignIn.css"
import logo from '../assets/photos/logobgWhite.png'; 

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        
        // Redirect based on role
        if (data.data.user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
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
        <img 
          src={logo} 
          alt="Logo Doctory" 
          className="logo-img"
        />
        <h2>Connexion</h2>
        <p>Accédez à votre compte Doctory</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            name="email"
            placeholder="Email" 
            value={formData.email}
            onChange={handleChange}
            required 
          />
          <input 
            type="password" 
            name="password"
            placeholder="Mot de passe" 
            value={formData.password}
            onChange={handleChange}
            required 
          />

          <button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="switch">
          Pas encore de compte ? <a href="/signup">Créer un compte</a>
        </p>
      </div>
    </div>
  )
}

export default SignIn
