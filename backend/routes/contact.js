const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL_USER,
      subject: `Doctory Contact - ${subject}`,
      html: `
        <h3>Nouveau message</h3>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Message :</strong></p>
        <p>${message}</p>
      `,
    });

    res.status(200).json({ message: "Email envoyé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur envoi email" });
  }
});

module.exports = router;
