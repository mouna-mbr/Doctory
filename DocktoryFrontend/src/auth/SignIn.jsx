import { FaStethoscope, FaPills, FaHeartbeat, FaSyringe, FaFlask } from "react-icons/fa"
import "../assets/css/SignIn.css"
import logo from '../assets/photos/logobgWhite.png'; 

const SignIn = () => {
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

        <form>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Mot de passe" required />

          <button type="submit">Se connecter</button>
        </form>

        <p className="switch">
          Pas encore de compte ? <a href="/signup">Créer un compte</a>
        </p>
      </div>
    </div>
  )
}

export default SignIn
