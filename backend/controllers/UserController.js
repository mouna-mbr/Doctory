const UserService = require("../services/UserService");

class UserController {
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
