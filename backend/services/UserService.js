const UserRepository = require("../repositories/UserRepository");

class UserService {
  // Get all users
  async getAllUsers(filters = {}) {
    try {
      return await UserRepository.findAll(filters);
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const user = await UserRepository.findById(id);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(role) {
    try {
      return await UserRepository.findByRole(role);
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async updateUser(id, updateData) {
    try {
      // Don't allow updating password through this method
      if (updateData.passwordHash || updateData.password) {
        throw new Error("Use change password endpoint to update password");
      }

      // Don't allow updating email if it already exists
      if (updateData.email) {
        const emailExists = await UserRepository.emailExists(updateData.email);
        const currentUser = await UserRepository.findById(id);
        
        if (emailExists && currentUser.email !== updateData.email) {
          throw new Error("Email already in use");
        }
      }

      const updatedUser = await UserRepository.update(id, updateData);
      if (!updatedUser) {
        throw new Error("User not found");
      }

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete user (deactivate)
  async deactivateUser(id) {
    try {
      const user = await UserRepository.softDelete(id);
      if (!user) {
        throw new Error("User not found");
      }
      return { message: "User deactivated successfully", user };
    } catch (error) {
      throw error;
    }
  }

  // Hard delete user
  async deleteUser(id) {
    try {
      const user = await UserRepository.delete(id);
      if (!user) {
        throw new Error("User not found");
      }
      return { message: "User deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Activate user
  async activateUser(id) {
    try {
      const user = await UserRepository.update(id, { isActive: true });
      if (!user) {
        throw new Error("User not found");
      }
      return { message: "User activated successfully", user };
    } catch (error) {
      throw error;
    }
  }

  // Approve license
  async approveLicense(userId, adminId) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.role !== "DOCTOR" && user.role !== "PHARMACIST") {
        throw new Error("Only doctors and pharmacists require license verification");
      }

      if (!user.licenseDocument) {
        throw new Error("No license document uploaded");
      }

      const updatedUser = await UserRepository.update(userId, {
        isLicenseVerified: true,
        licenseVerifiedAt: new Date(),
        licenseVerifiedBy: adminId,
        licenseRejectionReason: null,
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Reject license
  async rejectLicense(userId, reason) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (user.role !== "DOCTOR" && user.role !== "PHARMACIST") {
        throw new Error("Only doctors and pharmacists require license verification");
      }

      const updatedUser = await UserRepository.update(userId, {
        isLicenseVerified: false,
        licenseRejectionReason: reason,
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Get pending licenses
  async getPendingLicenses() {
    try {
      const pendingUsers = await UserRepository.findAll({
        $or: [{ role: "DOCTOR" }, { role: "PHARMACIST" }],
        licenseDocument: { $ne: null },
        isLicenseVerified: false,
        licenseRejectionReason: null,
      });

      return pendingUsers;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
