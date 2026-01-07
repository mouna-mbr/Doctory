"use client";

import "../assets/css/Doctors.css";
import { FaStar, FaUserMd } from "react-icons/fa";

const Doctors = () => {
  // Données mock (à remplacer plus tard par API)
  const doctors = [
    {
      id: 1,
      name: "Dr Mouna Ben Rebah",
      specialty: "Cardiologie",
      experience: 8,
      rating: 4.8,
      reviews: 120,
      price: 60,
      photo: "https://i.pravatar.cc/300?img=47",
    },
    {
      id: 2,
      name: "Dr Ahmed Trabelsi",
      specialty: "Dermatologie",
      experience: 5,
      rating: 4.6,
      reviews: 90,
      price: 50,
      photo: "https://i.pravatar.cc/300?img=32",
    },
    {
      id: 3,
      name: "Dr Sara Kammoun",
      specialty: "Pédiatrie",
      experience: 10,
      rating: 4.9,
      reviews: 150,
      price: 55,
      photo: "https://i.pravatar.cc/300?img=49",
    },
  ];

  return (
    <div className="doctors-container">
      <h2 className="doctors-title">
        <FaUserMd /> Nos Médecins
      </h2>

      <div className="doctors-grid">
        {doctors.map((doc) => (
          <div className="doctor-card" key={doc.id}>
            <div className="doctor-photo">
              <img src={doc.photo} alt={doc.name} />
            </div>

            <div className="doctor-info">
              <h3>{doc.name}</h3>
              <p className="specialty">{doc.specialty}</p>
              <p className="experience">
                {doc.experience} ans d’expérience
              </p>

              <div className="rating">
                <FaStar />
                <span>{doc.rating}</span>
                <small>({doc.reviews} avis)</small>
              </div>

              <div className="price">
                💰 {doc.price} DT / consultation
              </div>

              <a href={`/doctor/${doc.id}`} className="profile-btn">
                Voir le profil
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Doctors;
