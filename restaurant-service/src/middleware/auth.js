const jwt = require("jsonwebtoken");
const axios = require("axios");

// Middleware to authenticate users based on JWT token
exports.auth = async (req, res, next) => {
  try {
    // Allow bypassing auth in development mode if BYPASS_AUTH=true
    if (
      process.env.BYPASS_AUTH === "true" &&
      process.env.NODE_ENV === "development"
    ) {
      // Set a default user ID and role for testing
      req.userId = req.header("X-User-Id") || "test-user-id";
      req.userRole = req.header("X-User-Role") || "admin";
      return next();
    }

    // Get token from Authorization header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user ID and role in request object
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Middleware to check if user has admin role
exports.adminAuth = (req, res, next) => {
  if (req.userRole === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied: Admin privileges required" });
  }
};

// Middleware to check if user has restaurant_owner role
exports.restaurantOwnerAuth = (req, res, next) => {
  if (req.userRole === "restaurant_owner" || req.userRole === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied: Restaurant owner privileges required" });
  }
};
