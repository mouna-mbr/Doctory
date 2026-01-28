// services/QRCodeService.js
const QRCode = require("qrcode");

class QRCodeService {
  // Générer un QR Code
  async generateQRCode(data) {
    try {
      const qrCodeData = typeof data === "object" ? JSON.stringify(data) : data;
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        errorCorrectionLevel: "H",
        type: "png",
        width: 300,
        margin: 1,
      });
      
      return qrCodeBuffer;
    } catch (error) {
      throw new Error(`Erreur lors de la génération du QR Code: ${error.message}`);
    }
  }

  // Vérifier un QR Code
  async verifyQRCode(qrCodeData, prescriptionId) {
    try {
      const data = JSON.parse(qrCodeData);
      
      if (data.prescriptionId !== prescriptionId) {
        return { valid: false, message: "ID d'ordonnance invalide" };
      }

      // Vérifier la signature/hash si nécessaire
      // ...

      return { valid: true, data };
    } catch (error) {
      return { valid: false, message: "QR Code invalide ou corrompu" };
    }
  }
}

module.exports = new QRCodeService();