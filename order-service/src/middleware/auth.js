const jwt = require("jsonwebtoken");

// General authentication middleware
const verifyToken = (req, res, next) => {
  // For development or testing - if this environment variable is set, bypass authentication
  if (
    process.env.NODE_ENV === "development" ||
    process.env.BYPASS_AUTH === "true"
  ) {
    console.log("Auth bypassed in development mode");
    return next();
  }

  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication failed: No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.userData = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Authentication failed: Invalid token" });
  }
};

// Admin role verification middleware
const verifyAdmin = (req, res, next) => {
  // For development mode, check for an admin flag in headers
  if (
    process.env.NODE_ENV === "development" ||
    process.env.BYPASS_AUTH === "true"
  ) {
    // Check if we have a special header for admin in dev mode
    if (req.headers["x-admin-auth"] === "true") {
      return next();
    }
  }

  // In production, check the user role from JWT
  if (!req.userData || req.userData.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied: Admin privileges required" });
  }

  next();
};

module.exports = { verifyToken, verifyAdmin };
