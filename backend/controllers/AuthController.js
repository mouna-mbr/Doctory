const AuthService = require("../services/AuthService");

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { role, fullName, email, phoneNumber, password } = req.body;

      // Validation
      if (!role || !fullName || !email || !phoneNumber || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      // Validate role
      const validRoles = ["ADMIN", "DOCTOR", "PATIENT", "PHARMACIST"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      // Check if license document is required and provided
      if ((role === "DOCTOR" || role === "PHARMACIST") && !req.file) {
        return res.status(400).json({
          success: false,
          message: `Professional license document is required for ${role.toLowerCase()}s`,
        });
      }

      // Add license document path to request body if uploaded
      if (req.file) {
        req.body.licenseDocument = `/uploads/licenses/${req.file.filename}`;
      }

      const result = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        message: "User registered successfully. Please wait for admin to verify your license.",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.userId; // From auth middleware

      // Validation
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Old password and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      }

      const result = await AuthService.changePassword(
        userId,
        oldPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId; // From auth middleware
      const UserService = require("../services/UserService");
      const user = await UserService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Request password reset
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const result = await AuthService.requestPasswordReset(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Verify reset code
  async verifyResetCode(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          success: false,
          message: "Email and code are required",
        });
      }

      const result = await AuthService.verifyResetCode(email, code);

      res.status(200).json({
        success: true,
        message: "Code verified successfully",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Email, code, and new password are required",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }

      const result = await AuthService.resetPassword(email, code, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Verification token is required",
        });
      }

      const result = await AuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Resend verification email
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const result = await AuthService.resendVerificationEmail(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Manual verification (for testing/admin purposes)
  async manualVerifyUser(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const UserRepository = require("../repositories/UserRepository");
      
      // Find user by email
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update user verification status
      await UserRepository.update(user._id, { isEmailVerified: true });

      res.status(200).json({
        success: true,
        message: `User ${email} has been manually verified`,
        data: {
          email: user.email,
          fullName: user.fullName,
          isEmailVerified: true,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
  
  async verify2FA(req, res) {
    try {
      const { userId, code } = req.body;

      if (!userId || !code) {
        return res.status(400).json({
          success: false,
          message: "User ID and code are required",
        });
      }

      const result = await AuthService.verify2FA(userId, code);

      res.status(200).json({
        success: true,
        message: "2FA verification successful",
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  
  async toggle2FA(req, res) {
    try {
      const userId = req.user.userId;
      const { enabled } = req.body;

      const result = await AuthService.toggle2FA(userId, enabled);

      return res.status(200).json({
        success: true,
        message: result.message,
      });

    } catch (error) {
      console.error("Toggle 2FA error:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Erreur serveur",
      });
    }
  }

}

module.exports = new AuthController();
