const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // For development or testing - if this environment variable is set, bypass authentication
  if (
    process.env.NODE_ENV === "development" ||
    process.env.BYPASS_AUTH === "true"
  ) {
    console.log("Auth bypassed in development mode");
    return next();
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication failed: No token provided" });
    }

    // Verify token using the same secret as user-service
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure userId is extracted from token
    if (!decoded.userId) {
      throw new Error("Invalid token format");
    }

    req.userData = decoded;

    // For convenience, set req.userId from the token
    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res
      .status(401)
      .json({
        message: "Authentication failed: " + (error.message || "Invalid token"),
      });
  }
};
