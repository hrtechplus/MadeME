require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const paymentRoutes = require("./routes/paymentRoutes");
const logger = require("./utils/logger");

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
app.use(morgan("combined", { stream: logger.stream }));

// Body parsing - important to put this before the routes
// Only parse JSON for non-webhook routes
app.use((req, res, next) => {
  // Handle both PayPal and Stripe webhooks with raw body
  if (
    req.originalUrl === "/api/payment/webhook" ||
    req.originalUrl === "/api/payment/paypal-webhook"
  ) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Root health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "payment-service",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/payment", paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Error:", err);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  logger.info(`Payment service running on port ${PORT}`);
});
