import React from "react";
import '../assets/css/Accueil.css';
import logo from '../assets/photos/logobgWhite.png'; 

const Accueil = () => {
  return (
    <div className="home-container">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
                       <img 
                          src={logo} 
                          alt="Logo Doctory" 
                          className="Accueil-logo-img"
                          width="150"
                          height="150"
                        />
          <h1>
            Bienvenue sur <span>Doctory</span>
          </h1>
          <p>
            Doctory est une plateforme moderne qui facilite la gestion des
            services médicaux, des rendez-vous et la communication entre
            patients et professionnels de santé.
          </p>
          <button className="hero-btn">Commencer</button>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <h2>Nos Services</h2>
        <div className="features-list">
          <div className="feature-card">
            <h3>Rendez-vous</h3>
            <p>Planifiez et gérez vos rendez-vous médicaux facilement.</p>
          </div>
          <div className="feature-card">
            <h3>Dossiers Médicaux</h3>
            <p>Accédez à vos informations médicales en toute sécurité.</p>
          </div>
          <div className="feature-card">
            <h3>Consultation</h3>
            <p>Facilitez la communication entre médecins et patients.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Accueil;
