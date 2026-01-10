const nodemailer = require("nodemailer");

// Create email transporter
const createTransporter = () => {
  // For development, you can use Gmail or a service like Mailtrap
  // For production, use a proper email service (SendGrid, AWS SES, etc.)
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your email password or app password
    },
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetCode) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Doctory" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Réinitialisation de votre mot de passe - Doctory",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #2c3e50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .code {
              background-color: #ecf0f1;
              padding: 15px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 5px;
              color: #2c3e50;
              margin: 20px 0;
              border-radius: 5px;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              color: #856404;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Doctory</h1>
            </div>
            <div class="content">
              <h2>Réinitialisation de votre mot de passe</h2>
              <p>Bonjour,</p>
              <p>Vous avez demandé à réinitialiser votre mot de passe. Utilisez le code ci-dessous pour continuer :</p>
              
              <div class="code">${resetCode}</div>
              
              <p>Ce code est valide pendant <strong>10 minutes</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Attention :</strong> Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email. Votre mot de passe restera inchangé.
              </div>
              
              <p>Cordialement,<br>L'équipe Doctory</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Send email verification email
const sendVerificationEmail = async (email, verificationToken, fullName) => {
  const transporter = createTransporter();
  const verificationLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"Doctory" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Vérifiez votre adresse email - Doctory",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #2c3e50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              background-color: #27ae60;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #229954;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 12px;
              margin: 20px 0;
              color: #856404;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
            .link-text {
              word-break: break-all;
              color: #3498db;
              font-size: 12px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Doctory</h1>
            </div>
            <div class="content">
              <h2>Bienvenue sur Doctory !</h2>
              <p>Bonjour ${fullName},</p>
              <p>Merci de vous être inscrit sur Doctory. Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Vérifier mon email</a>
              </div>
              
              <p>Ce lien est valide pendant <strong>24 heures</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Attention :</strong> Si vous n'avez pas créé de compte sur Doctory, ignorez simplement cet email.
              </div>
              
              <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
              <p class="link-text">${verificationLink}</p>
              
              <p>Cordialement,<br>L'équipe Doctory</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
};
