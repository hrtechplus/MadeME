const express = require("express");
const { body } = require("express-validator");
const userController = require("../controllers/userController");
const { auth, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Public routes
// Register new user
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("name").notEmpty().withMessage("Name is required"),
  ],
  userController.register
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  userController.login
);

// Request password reset
router.post(
  "/request-password-reset",
  [body("email").isEmail().withMessage("Please enter a valid email")],
  userController.requestPasswordReset
);

// Reset password with token
router.post(
  "/reset-password",
  [
    body("resetToken").notEmpty().withMessage("Reset token is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  userController.resetPassword
);

// Protected routes (require authentication)
// Get current user profile
router.get("/profile", auth, userController.getProfile);

// Update user profile
router.patch(
  "/profile",
  auth,
  [
    body("name").optional(),
    body("phone").optional(),
    body("address").optional(),
  ],
  userController.updateProfile
);

// Change password
router.post(
  "/change-password",
  auth,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  userController.changePassword
);

// Admin routes
// Get all users (admin only)
router.get("/", auth, adminAuth, userController.getAllUsers);

// Get user by id (admin only)
router.get("/:id", auth, adminAuth, userController.getUserById);

// Update user role (admin only)
router.patch(
  "/:id/role",
  auth,
  adminAuth,
  [body("role").notEmpty().withMessage("Role is required")],
  userController.updateUserRole
);

// Delete user (admin only)
router.delete("/:id", auth, adminAuth, userController.deleteUser);

module.exports = router;
