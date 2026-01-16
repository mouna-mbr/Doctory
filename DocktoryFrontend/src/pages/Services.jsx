import {
  FaUserMd,
  FaCalendarCheck,
  FaFolderOpen,
  FaHeartbeat,
  FaStethoscope,
  FaShieldAlt,
} from "react-icons/fa";
import "../assets/css/Services.css";

const Services = () => {
  const services = [
    {
      icon: <FaUserMd />,
      title: "Consultation avec médecins",
      description:
        "Prenez rendez-vous facilement avec des médecins qualifiés selon leur spécialité.",
    },
    {
      icon: <FaCalendarCheck />,
      title: "Gestion des rendez-vous",
      description:
        "Planifiez, modifiez ou annulez vos rendez-vous médicaux en quelques clics.",
    },
    {
      icon: <FaFolderOpen />,
      title: "Dossier médical",
      description:
        "Accédez à votre dossier médical organisé par spécialité et par date.",
    },
    {
      icon: <FaHeartbeat />,
      title: "Suivi médical",
      description:
        "Suivi continu de votre état de santé avec remarques et diagnostics médicaux.",
    },
    {
      icon: <FaStethoscope />,
      title: "Espace médecin",
      description:
        "Interface dédiée aux médecins pour gérer patients, dossiers et rendez-vous.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Sécurité & confidentialité",
      description:
        "Vos données médicales sont protégées et strictement confidentielles.",
    },
  ];

  return (
    <div className="services-container">
      <div className="services-header">
        <h1>Nos Services</h1>
        <p>
          Doctory vous accompagne avec des services médicaux modernes, simples et
          sécurisés.
        </p>
      </div>

      <div className="services-grid">
        {services.map((service, index) => (
          <div className="service-card" key={index}>
            <div className="service-icon">{service.icon}</div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;
