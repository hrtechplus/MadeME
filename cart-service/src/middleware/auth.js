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
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication failed: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Authentication failed: Invalid token" });
  }
};
