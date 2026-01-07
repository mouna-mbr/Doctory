const User = require("../models/User");

class UserRepository {
  // Create a new user
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  // Find user by email
  async findByEmail(email) {
    return await User.findOne({ email });
  }

  // Find user by ID
  async findById(id) {
    return await User.findById(id).select("-passwordHash");
  }

  // Find user by ID with password (for authentication)
  async findByIdWithPassword(id) {
    return await User.findById(id);
  }

  // Find all users
  async findAll(filters = {}) {
    return await User.find(filters).select("-passwordHash");
  }

  // Update user
  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");
  }

  // Delete user (soft delete by setting isActive to false)
  async softDelete(id) {
    return await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select("-passwordHash");
  }

  // Hard delete user
  async delete(id) {
    return await User.findByIdAndDelete(id);
  }

  // Update last login
  async updateLastLogin(id) {
    return await User.findByIdAndUpdate(
      id,
      { lastLoginAt: new Date() },
      { new: true }
    ).select("-passwordHash");
  }

  // Check if email exists
  async emailExists(email) {
    const user = await User.findOne({ email });
    return !!user;
  }

  // Find users by role
  async findByRole(role) {
    return await User.find({ role, isActive: true }).select("-passwordHash");
  }
}

module.exports = new UserRepository();
