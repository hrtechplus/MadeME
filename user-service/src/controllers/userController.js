const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const crypto = require("crypto");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || "24h",
  });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log(
      "Registration request received:",
      JSON.stringify(req.body, null, 2)
    );

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res
        .status(400)
        .json({ message: "Validation failed", errors: errors.array() });
    }

    const { email, password, name, phone, address } = req.body;

    if (!email || !password || !name) {
      console.log("Missing required fields");
      return res.status(400).json({
        message: "Required fields missing",
        requiredFields: {
          email: !email,
          password: !password,
          name: !name,
        },
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res
        .status(400)
        .json({ message: `User with email ${email} already exists` });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create new user
    const user = new User({
      email,
      password,
      name,
      phone: phone || "",
      address: address || {},
      verificationToken,
    });

    await user.save();
    console.log("User saved to database:", user._id);

    // Auto-verify users in development
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    console.log("User verified automatically");

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      user: user.toJSON(),
      token,
    });
    console.log("Registration successful for:", email);
  } catch (error) {
    console.error("Registration error details:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Error registering user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email address before logging in",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    res.json({
      user: req.user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = req.user;

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error changing password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal that the user doesn't exist
      return res.json({
        message: "If that email exists, a password reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In a production environment, send reset email here
    // For demo purposes, we'll return the token directly
    res.json({
      message: "Password reset initiated",
      resetToken, // In production, this would be sent via email
    });
  } catch (error) {
    res.status(500).json({
      message: "Error requesting password reset",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({
      message: "Error resetting password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get users by status (accessible to normal users for pending status)
exports.getUsersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const isAdmin = req.role === "admin";

    // Normal users can only access pending status
    if (!isAdmin && status !== "PENDING") {
      return res.status(403).json({
        message: "Access denied: You can only view users with pending status",
      });
    }

    const users = await User.find({ status });
    res.json({ users });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users by status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Only admin can access all users
    if (req.role !== "admin") {
      return res.status(403).json({
        message: "Access denied: Admin privileges required",
      });
    }

    const users = await User.find({});
    res.json({ users });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Admin: Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Admin: Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate role
    if (!["customer", "restaurant_owner", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    user.role = role;
    await user.save();

    res.json({
      message: "User role updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating user role",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Admin: Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
