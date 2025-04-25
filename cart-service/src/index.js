require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const cartRoutes = require("./routes/cartRoutes");

// Try to load environment-specific variables (useful for local development)
const localEnvPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(localEnvPath)) {
  console.log("Loading local environment variables from .env.local");
  require("dotenv").config({ path: localEnvPath });
}

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan("dev"));

// Body parsing with increased limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Root health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "cart-service",
    timestamp: new Date().toISOString(),
    mongodbStatus:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Routes
app.use("/api/cart", cartRoutes);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("Error details:", err);
  console.error("Stack trace:", err.stack);

  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
    path: req.path,
    method: req.method,
  });
});

// Connect to MongoDB with enhanced error handling
console.log(
  `Connecting to MongoDB... (${
    process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@") ||
    "mongodb://localhost:27017/cart-service"
  })`
);

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // Increased timeout
    connectTimeoutMS: 10000, // Increased timeout
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error details:", err);

    if (err.name === "MongoServerSelectionError") {
      console.error(
        "Could not connect to any MongoDB server. Is MongoDB running?"
      );
    } else if (err.name === "MongoServerError" && err.code === 13) {
      console.error(
        "================================================================="
      );
      console.error(
        "AUTHENTICATION ERROR: Invalid username or password for MongoDB"
      );
      console.error(
        "================================================================="
      );
      console.error("To fix this issue, try one of the following:");
      console.error(
        "1. If running locally: Edit the .env.local file with correct credentials"
      );
      console.error(
        "2. If using Docker: Make sure the MongoDB service is configured with auth"
      );
      console.error(
        "   or update the MONGODB_URI in docker-compose.yml to match your setup"
      );
      console.error(
        "================================================================="
      );
    }

    // Don't exit process for development to allow for reconnection
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  });

// Use a different port to avoid conflicts with other services
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Cart service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `MongoDB status: ${
      mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    }`
  );
});
