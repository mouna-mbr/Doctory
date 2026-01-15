import { useState } from "react";
import "../assets/css/Contact.css";
import logo from '../assets/photos/logonobg.png';

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess("Message envoyé avec succès 💙");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setSuccess("Erreur lors de l’envoi ❌");
      }
    } catch (err) {
      setSuccess("Serveur indisponible ❌");
    }

    setLoading(false);
  };

  return (
    <div className="contact-container">
      <div className="contact-card">
         <img 
                  src={logo} 
                  alt="Logo Doctory" 
                  className="logo-img"
                />
        <h2>Contactez-nous</h2>
        <p>Une question ? Un problème ? Écris-nous 💬</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Nom complet"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="subject"
            placeholder="Sujet"
            value={form.subject}
            onChange={handleChange}
            required
          />

          <textarea
            name="message"
            placeholder="Votre message..."
            rows="5"
            value={form.message}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer"}
          </button>

          {success && <span className="contact-msg">{success}</span>}
        </form>
      </div>
    </div>
  );
};

export default Contact;
