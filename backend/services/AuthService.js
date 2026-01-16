const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserRepository = require("../repositories/UserRepository");
const PasswordReset = require("../models/PasswordReset");
const EmailVerification = require("../models/EmailVerification");
const { sendPasswordResetEmail, sendVerificationEmail } = require("../config/email");

class AuthService {
  // Generate JWT token
  generateToken(userId, role) {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );
  }

  // Register a new user
  async register(userData) {
    try {
      // Check if email already exists
      const emailExists = await UserRepository.emailExists(userData.email);
      if (emailExists) {
        throw new Error("Email already registered");
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      // Create user without password field and set email as not verified
      const { password, ...userDataWithoutPassword } = userData;
      const newUser = await UserRepository.create({
        ...userDataWithoutPassword,
        passwordHash,
        isEmailVerified: false,
      });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save verification token to database
      await EmailVerification.create({
        userId: newUser._id,
        email: newUser.email,
        verificationToken,
        expiresAt,
      });

      // Send verification email
      try {
        await sendVerificationEmail(newUser.email, verificationToken, newUser.fullName);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue with registration even if email fails
      }

      // Generate token (user can still browse but some features may be restricted)
      const token = this.generateToken(newUser._id, newUser.role);

      // Return user without password hash
      return {
        user: {
          id: newUser._id,
          role: newUser.role,
          fullName: newUser.fullName,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          isActive: newUser.isActive,
          isEmailVerified: newUser.isEmailVerified,
          createdAt: newUser.createdAt,
        },
        token,
        message: "Account created! Please check your email to verify your account.",
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Find user by email (with password)
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error("Account is deactivated");
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw new Error("Please verify your email before logging in. Check your inbox for the verification link.");
      }

      // Check if license is verified for doctors and pharmacists
      if ((user.role === "DOCTOR" || user.role === "PHARMACIST")) {
        if (!user.isLicenseVerified) {
          if (user.licenseRejectionReason) {
            throw new Error(`Your license was rejected. Reason: ${user.licenseRejectionReason}. Please contact support.`);
          }
          throw new Error("Your professional license is pending verification by admin. Please wait for approval.");
        }
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Update last login
      await UserRepository.updateLastLogin(user._id);

      // Generate token
      const token = this.generateToken(user._id, user.role);

      // Return user without password hash
      return {
        user: {
          id: user._id,
          role: user.role,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          isLicenseVerified: user.isLicenseVerified,
          createdAt: user.createdAt,
          lastLoginAt: new Date(),
        },
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  // Verify token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  // Change password
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Get user with password
      const user = await UserRepository.findByIdWithPassword(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      await UserRepository.update(userId, { passwordHash: newPasswordHash });

      return { message: "Password changed successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      // Find user by email
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists
        return { message: "If an account exists with this email, a reset code has been sent." };
      }

      // Generate 6-digit code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Set expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Delete any existing reset codes for this user
      await PasswordReset.deleteMany({ userId: user._id });

      // Save reset code to database
      await PasswordReset.create({
        userId: user._id,
        email: user.email,
        resetCode,
        expiresAt,
      });

      // Send email with reset code
      await sendPasswordResetEmail(user.email, resetCode);

      return { message: "If an account exists with this email, a reset code has been sent." };
    } catch (error) {
      console.error("Password reset error:", error);
      throw new Error("Failed to process password reset request");
    }
  }

  // Verify reset code
  async verifyResetCode(email, code) {
    try {
      // Find valid reset code
      const resetRequest = await PasswordReset.findOne({
        email,
        resetCode: code,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!resetRequest) {
        throw new Error("Invalid or expired reset code");
      }

      return { valid: true };
    } catch (error) {
      throw error;
    }
  }

  // Reset password with code
  async resetPassword(email, code, newPassword) {
    try {
      // Find valid reset code
      const resetRequest = await PasswordReset.findOne({
        email,
        resetCode: code,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!resetRequest) {
        throw new Error("Invalid or expired reset code");
      }

      // Find user
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        throw new Error("User not found");
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      await UserRepository.update(user._id, { passwordHash: newPasswordHash });

      // Mark reset code as used
      await PasswordReset.updateOne(
        { _id: resetRequest._id },
        { isUsed: true }
      );

      return { message: "Password reset successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Verify email with token
  async verifyEmail(token) {
    try {
      // Find verification record
      const verification = await EmailVerification.findOne({
        verificationToken: token,
        isVerified: false,
        expiresAt: { $gt: new Date() },
      });

      if (!verification) {
        throw new Error("Invalid or expired verification link");
      }

      // Update user email verification status
      await UserRepository.update(verification.userId, { isEmailVerified: true });

      // Mark verification as completed
      await EmailVerification.updateOne(
        { _id: verification._id },
        { isVerified: true, verifiedAt: new Date() }
      );

      return { message: "Email verified successfully! You can now log in." };
    } catch (error) {
      throw error;
    }
  }

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      // Find user
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists
        return { message: "If an account exists with this email, a verification link has been sent." };
      }

      if (user.isEmailVerified) {
        throw new Error("Email is already verified");
      }

      // Delete old verification tokens for this user
      await EmailVerification.deleteMany({ userId: user._id });

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save new verification token
      await EmailVerification.create({
        userId: user._id,
        email: user.email,
        verificationToken,
        expiresAt,
      });

      // Send verification email
      await sendVerificationEmail(user.email, verificationToken, user.fullName);

      return { message: "If an account exists with this email, a verification link has been sent." };
    } catch (error) {
      console.error("Resend verification error:", error);
      throw new Error("Failed to resend verification email");
    }
  }
}

module.exports = new AuthService();
