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

// Activate user (Admin or own account)
router.patch(
  "/:id/activate",
  UserController.activateUser.bind(UserController)
);

// Deactivate user (Admin or own account)
router.patch(
  "/:id/deactivate",
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

// License verification routes (Admin only)
router.get(
  "/pending-licenses/all",
  roleMiddleware("ADMIN"),
  UserController.getPendingLicenses.bind(UserController)
);

router.patch(
  "/:id/approve-license",
  roleMiddleware("ADMIN"),
  UserController.approveLicense.bind(UserController)
);

router.patch(
  "/:id/reject-license",
  roleMiddleware("ADMIN"),
  UserController.rejectLicense.bind(UserController)
);

module.exports = router;
