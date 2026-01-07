const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/UserRepository");

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

      // Create user without password field
      const { password, ...userDataWithoutPassword } = userData;
      const newUser = await UserRepository.create({
        ...userDataWithoutPassword,
        passwordHash,
      });

      // Generate token
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
          createdAt: newUser.createdAt,
        },
        token,
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
}

module.exports = new AuthService();
