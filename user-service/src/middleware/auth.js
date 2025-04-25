const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to authenticate users based on JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user with matching id and token
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Add user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Middleware to check if user has admin role
const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied: Admin privileges required" });
  }
};

// Middleware to check if user has restaurant_owner role
const restaurantOwnerAuth = (req, res, next) => {
  if (req.user && req.user.role === "restaurant_owner") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Access denied: Restaurant owner privileges required" });
  }
};

module.exports = { auth, adminAuth, restaurantOwnerAuth };
