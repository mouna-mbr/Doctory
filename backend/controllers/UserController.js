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

      // Prevent updating sensitive fields
      delete updateData.passwordHash;
      delete updateData.createdAt;

      const user = await UserService.updateUser(id, updateData);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
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
}

module.exports = new UserController();
