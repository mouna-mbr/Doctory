const express = require("express");
const AuthController = require("../controllers/AuthController");

const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();


// Public routes
router.post("/register", AuthController.register.bind(AuthController));
router.post("/login", AuthController.login.bind(AuthController));
router.post("/forgot-password", AuthController.requestPasswordReset.bind(AuthController));
router.post("/verify-reset-code", AuthController.verifyResetCode.bind(AuthController));
router.post("/reset-password", AuthController.resetPassword.bind(AuthController));
router.post("/verify-email", AuthController.verifyEmail.bind(AuthController));
router.post("/resend-verification", AuthController.resendVerification.bind(AuthController));

// Manual verification route (for testing/admin)
router.post("/manual-verify", AuthController.manualVerifyUser.bind(AuthController));

// Protected routes
router.post(
  "/change-password",
  authMiddleware,
  AuthController.changePassword.bind(AuthController)
);
router.get(
  "/profile",
  authMiddleware,
  AuthController.getProfile.bind(AuthController)
);
// Route supplémentaire pour /me (plus courant dans les APIs REST)
router.get(
  "/me",
  authMiddleware,
  AuthController.getProfile.bind(AuthController) // Utilise la même méthode
);
router.post("/verify-2fa", AuthController.verify2FA.bind(AuthController));
router.post(
  "/toggle-2fa",
  authMiddleware,
  AuthController.toggle2FA
);

module.exports = router;
