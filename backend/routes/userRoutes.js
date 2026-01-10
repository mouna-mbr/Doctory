const express = require("express");
const UserController = require("../controllers/UserController");
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");
const upload = require("../config/upload");

const router = express.Router();
router.get("/doctors", UserController.getDoctors.bind(UserController));

// Get doctor by ID (public route)
router.get("/doctors/:id", UserController.getDoctorById.bind(UserController));

// All user routes require authentication
router.use(authMiddleware);
// Get all doctors (public route)


// Get all users (Admin only)
router.get(
  "/",
  roleMiddleware("ADMIN"),
  UserController.getAllUsers.bind(UserController)
);

// Get users by role (Admin only)
router.get(
  "/role/:role",
  roleMiddleware("ADMIN"),
  UserController.getUsersByRole.bind(UserController)
);

// Get user by ID (Admin or own profile)
router.get("/:id", UserController.getUserById.bind(UserController));

// Update user (Admin or own profile)
router.put("/:id", UserController.updateUser.bind(UserController));

// Activate user (Admin only)
router.patch(
  "/:id/activate",
  roleMiddleware("ADMIN"),
  UserController.activateUser.bind(UserController)
);

// Deactivate user (Admin only)
router.patch(
  "/:id/deactivate",
  roleMiddleware("ADMIN"),
  UserController.deactivateUser.bind(UserController)
);

// Delete user (Admin only)
router.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  UserController.deleteUser.bind(UserController)
);

// Upload profile image (User can upload their own, Admin can upload for anyone)
router.post(
  "/:id/upload-profile-image",
  upload.single("profileImage"),
  UserController.uploadProfileImage.bind(UserController)
);

module.exports = router;
