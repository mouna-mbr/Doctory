const express = require("express");
const AuthController = require("../controllers/AuthController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", AuthController.register.bind(AuthController));
router.post("/login", AuthController.login.bind(AuthController));

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

module.exports = router;
