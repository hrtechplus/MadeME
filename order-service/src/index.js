require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const orderRoutes = require("./routes/orderRoutes");
const fs = require("fs");
const path = require("path");

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
app.use(morgan("combined"));

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Root health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "order-service",
    timestamp: new Date().toISOString(),
    mongodbStatus:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Routes - Using API specific path prefix
app.use("/api/orders", orderRoutes);

// Error handling middleware with improved details
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
  `Connecting to MongoDB... (${process.env.MONGODB_URI.replace(
    /\/\/([^:]+):([^@]+)@/,
    "//***:***@"
  )})`
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
    }
    // Don't exit in development mode to allow time for MongoDB to start up (e.g., in Docker)
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  });

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(
    `MongoDB status: ${
      mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    }`
  );
  console.log(`API base URL: http://localhost:${PORT}/api/orders`);
});
