const UserService = require("../services/UserService");

class UserController {

  // GET /api/users/doctors - Get all doctors (public)
  async getDoctors(req, res) {
    try {
      const doctors = await UserService.getUsersByRole("DOCTOR");
      
      // Filtrer les données sensibles
      const publicDoctors = doctors.map(doctor => ({
        _id: doctor._id,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        yearsOfExperience: doctor.yearsOfExperience,
        consultationPrice: doctor.consultationPrice,
        location: doctor.location || doctor.city || "Tunis",
        phoneNumber: doctor.phoneNumber,
        email: doctor.email,
        profilePicture: doctor.profilePicture,
        description: doctor.description || doctor.bio || "Médecin professionnel",
        isAvailable: doctor.isAvailable !== false,
        rating: doctor.rating || 4.5,
        reviewsCount: doctor.reviewsCount || 0,
        createdAt: doctor.createdAt
      }));

      res.status(200).json({
        success: true,
        count: publicDoctors.length,
        data: publicDoctors,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/users/doctors/:id - Get doctor by ID (public)
  async getDoctorById(req, res) {
    try {
      const { id } = req.params;
      const doctor = await UserService.getUserById(id);

      if (!doctor || doctor.role !== "DOCTOR") {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      // Données publiques seulement
      const publicDoctor = {
        _id: doctor._id,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        yearsOfExperience: doctor.yearsOfExperience,
        consultationPrice: doctor.consultationPrice,
        location: doctor.location || doctor.city || "Tunis",
        phoneNumber: doctor.phoneNumber,
        email: doctor.email,
        profilePicture: doctor.profilePicture,
        description: doctor.description || doctor.bio || "Médecin professionnel",
        isAvailable: doctor.isAvailable !== false,
        rating: doctor.rating || 4.5,
        reviewsCount: doctor.reviewsCount || 0,
        education: doctor.education || [],
        languages: doctor.languages || [],
        createdAt: doctor.createdAt
      };

      res.status(200).json({
        success: true,
        data: publicDoctor,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }




  // Get all users
  async getAllUsers(req, res) {
    try {
      const { role, isActive } = req.query;
      const filters = {};

      if (role) filters.role = role;
      if (isActive !== undefined) filters.isActive = isActive === "true";

      const users = await UserService.getAllUsers(filters);

      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

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

  // Get users by role
  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;

      // Validate role
      const validRoles = ["ADMIN", "DOCTOR", "PATIENT", "PHARMACIST"];
      if (!validRoles.includes(role.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      const users = await UserService.getUsersByRole(role.toUpperCase());

      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log("=== UPDATE USER REQUEST ===");
      console.log("User ID:", id);
      console.log("Update Data:", updateData);
      console.log("Authenticated User:", req.user);

      // Prevent updating sensitive fields
      delete updateData.passwordHash;
      delete updateData.createdAt;

      // Convert empty strings to null for optional fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === "" || updateData[key] === undefined) {
          updateData[key] = null;
        }
      });

      const user = await UserService.updateUser(id, updateData);

      console.log("Updated User:", user);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      console.error("Update Error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Deactivate user
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.userId;
      const requestingUserRole = req.user.role;

      // Check permissions: Admin can deactivate anyone, users can only deactivate themselves
      if (requestingUserRole !== "ADMIN" && requestingUserId.toString() !== id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas la permission de désactiver ce compte",
        });
      }

      const result = await UserService.deactivateUser(id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Activate user
  async activateUser(req, res) {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.userId;
      const requestingUserRole = req.user.role;

      // Check permissions: Admin can activate anyone, users can only activate themselves
      if (requestingUserRole !== "ADMIN" && requestingUserId.toString() !== id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas la permission de réactiver ce compte",
        });
      }

      const result = await UserService.activateUser(id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.user,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Delete user (hard delete)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Upload profile image
  async uploadProfileImage(req, res) {
    try {
      const { id } = req.params;

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Check if user is updating their own profile or is admin
      if (req.user.userId !== id && req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "You can only update your own profile image",
        });
      }

      // Construct the image path
      const imagePath = `/uploads/profiles/${req.file.filename}`;

      // Update user's profileImage field
      await UserService.updateUser(id, { profileImage: imagePath });

      res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        data: {
          profileImage: imagePath,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Approve license (admin only)
  async approveLicense(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.userId;

      const result = await UserService.approveLicense(id, adminId);

      res.status(200).json({
        success: true,
        message: "License approved successfully",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Reject license (admin only)
  async rejectLicense(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason is required",
        });
      }

      const result = await UserService.rejectLicense(id, reason);

      res.status(200).json({
        success: true,
        message: "License rejected",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get pending license verifications (admin only)
  async getPendingLicenses(req, res) {
    try {
      const result = await UserService.getPendingLicenses();

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new UserController();
