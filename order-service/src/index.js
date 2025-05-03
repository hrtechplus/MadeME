require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const morgan = require("morgan");
const orderRoutes = require("./routes/orderRoutes");
const rabbitMQ = require("./utils/rabbitmq");
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
    rabbitmqStatus: rabbitMQ.connection ? "connected" : "disconnected",
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

    // After MongoDB is connected, initialize RabbitMQ
    initializeRabbitMQ();
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

// Initialize RabbitMQ connection and message consumers
async function initializeRabbitMQ() {
  try {
    await rabbitMQ.connect();

    // Set up message consumers for different queues
    await setupMessageConsumers();

    console.log("RabbitMQ connection and consumers initialized successfully");
  } catch (error) {
    console.error("Failed to initialize RabbitMQ:", error.message);
  }
}

// Set up message consumers for different queues
async function setupMessageConsumers() {
  const orderController = require('./controllers/orderController');
  
  // Consume messages from payment-service
  await rabbitMQ.consumeMessages('payment-status-updates', async (message) => {
    console.log('Received payment status update:', message);
    const { orderId, status, paymentId } = message;
    
    // Update the order with the payment status
    try {
      const updatedOrder = await orderController.updateOrderPaymentStatus(orderId, status, paymentId);
      if (updatedOrder) {
        console.log(`Order ${orderId} payment status updated to ${status}`);
      } else {
        console.error(`Failed to update payment status for order ${orderId}`);
      }
    } catch (error) {
      console.error(`Error processing payment update for order ${orderId}:`, error.message);
    }
  });
  
  // Consume messages about restaurant availability
  await rabbitMQ.consumeMessages('restaurant-status-updates', async (message) => {
    console.log('Received restaurant status update:', message);
    // Process restaurant status update
    const { restaurantId, status, reason } = message;
    
    // Here you would implement logic to handle restaurant availability changes
    // For example, if a restaurant becomes unavailable, you might need to notify
    // users with pending orders from that restaurant
    
    console.log(`Restaurant ${restaurantId} status changed to ${status}`);
  });
  
  // Add more message consumers as needed
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(
    `MongoDB status: ${
      mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    }`
  );
  console.log(
    `RabbitMQ status: ${rabbitMQ.connection ? "connected" : "disconnected"}`
  );
  console.log(`API base URL: http://localhost:${PORT}/api/orders`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down order-service gracefully...");

  try {
    // Close RabbitMQ connection
    if (rabbitMQ) {
      await rabbitMQ.close();
    }

    // Close MongoDB connection
    if (mongoose.connection) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }

    console.log("Shutdown completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error.message);
    process.exit(1);
  }
});
