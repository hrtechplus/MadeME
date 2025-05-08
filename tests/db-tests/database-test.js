/**
 * Database Testing Script for MadeME Food Delivery System
 *
 * This script tests database connections and basic CRUD operations
 * across all microservices (user, restaurant, order, cart, and payment).
 *
 * Usage: node database-test.js
 */

const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables - try multiple possible locations
dotenv.config(); // First try local .env

// Try to load root project .env files
const projectRootEnvPath = path.join(__dirname, "../../.env");
if (fs.existsSync(projectRootEnvPath)) {
  console.log("Loading project root environment variables from .env");
  dotenv.config({ path: projectRootEnvPath });
}

// Try to load local environment variables if available
const localEnvPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(localEnvPath)) {
  console.log("Loading local environment variables from .env.local");
  dotenv.config({ path: localEnvPath });
}

// Try service-specific .env files for each service
const services = ["user", "restaurant", "order", "cart", "payment"];
services.forEach((service) => {
  const serviceEnvPath = path.join(__dirname, `../../${service}-service/.env`);
  if (fs.existsSync(serviceEnvPath)) {
    console.log(`Loading ${service} service environment variables`);
    dotenv.config({ path: serviceEnvPath });
  }
});

// Default MongoDB URIs if not specified in environment variables
const DEFAULT_DB_URIS = {
  user: "mongodb://localhost:27017/mademe-users",
  restaurant: "mongodb://localhost:27017/mademe-restaurants",
  order: "mongodb://localhost:27017/mademe-orders",
  cart: "mongodb://localhost:27017/mademe-cart",
  payment: "mongodb://localhost:27017/mademe-payments",
};

// Test configuration
const CONFIG = {
  timeout: 10000, // Increased to 10 seconds timeout for operations
  connectRetryCount: 3, // Number of retries for database connection
  connectRetryDelay: 2000, // Delay between retries in ms
  cleanupAfterTest: true, // Remove test data after tests
};

// Console formatting
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Logging utilities
const logger = {
  info: (message) =>
    console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`),
  success: (message) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  warning: (message) =>
    console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  error: (message) =>
    console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
  section: (message) =>
    console.log(
      `\n${colors.bright}${colors.magenta}=== ${message} ===${colors.reset}\n`
    ),
};

// Test data generation utilities
const testData = {
  user: () => ({
    email: `test-${uuidv4()}@example.com`,
    password: "password123",
    name: "Test User",
    role: "customer",
    isVerified: true,
    phone: "123-456-7890",
    address: {
      street: "123 Test St",
      city: "Test City",
      state: "TS",
      zipCode: "12345",
      country: "Test Country",
    },
  }),

  restaurant: (ownerId) => ({
    name: `Test Restaurant ${uuidv4().substring(0, 8)}`,
    description: "A test restaurant for database testing",
    cuisine: "Test Cuisine",
    address: {
      street: "456 Test Ave",
      city: "Test City",
      state: "TS",
      zipCode: "12345",
    },
    contactPhone: "987-654-3210",
    contactEmail: "test-restaurant@example.com",
    ownerId: ownerId || "test-owner-id",
    menu: [],
  }),

  menuItem: () => ({
    name: `Test Item ${uuidv4().substring(0, 8)}`,
    description: "A delicious test item",
    price: 9.99,
    category: "Test Category",
    isAvailable: true,
  }),

  cart: (userId) => ({
    userId: userId || "test-user-id",
    items: [],
    total: 0,
  }),

  cartItem: (restaurantId) => ({
    itemId: uuidv4(),
    name: "Test Cart Item",
    price: 9.99,
    quantity: 2,
    restaurantId: restaurantId || "test-restaurant-id",
  }),

  order: (userId, restaurantId) => ({
    userId: userId || "test-user-id",
    restaurantId: restaurantId || "test-restaurant-id",
    items: [
      {
        itemId: uuidv4(),
        name: "Test Order Item",
        price: 9.99,
        quantity: 1,
      },
    ],
    total: 9.99,
    status: "PENDING",
  }),

  payment: (orderId, userId) => ({
    orderId: orderId || "test-order-id",
    userId: userId || "test-user-id",
    amount: 9.99,
    status: "PENDING",
    transactionId: uuidv4(),
    paymentMethod: "CARD",
  }),
};

// Schema definitions (simplified versions of the actual schemas)
const schemas = {
  user: new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      name: { type: String, required: true },
      role: {
        type: String,
        enum: ["customer", "restaurant_owner", "admin"],
        default: "customer",
      },
      isVerified: { type: Boolean, default: false },
      phone: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
    },
    { timestamps: true }
  ),

  restaurant: new mongoose.Schema(
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      cuisine: { type: String, required: true },
      address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
      },
      contactPhone: { type: String, required: true },
      contactEmail: { type: String, required: true },
      ownerId: { type: String, required: true },
      menu: [
        {
          name: String,
          description: String,
          price: Number,
          category: String,
          isAvailable: Boolean,
        },
      ],
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  ),

  cart: new mongoose.Schema(
    {
      userId: { type: String, required: true, unique: true },
      items: [
        {
          itemId: { type: String, required: true },
          name: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, required: true, min: 1 },
          restaurantId: { type: String, required: true },
        },
      ],
      total: { type: Number, default: 0 },
    },
    { timestamps: true }
  ),

  order: new mongoose.Schema(
    {
      userId: { type: String, required: true },
      restaurantId: { type: String, required: true },
      items: [
        {
          itemId: { type: String, required: true },
          name: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, required: true },
        },
      ],
      total: { type: Number, required: true },
      status: {
        type: String,
        enum: [
          "VERIFYING",
          "PENDING",
          "CONFIRMED",
          "REJECTED",
          "PREPARING",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "CANCELLED",
        ],
        default: "VERIFYING",
      },
    },
    { timestamps: true }
  ),

  payment: new mongoose.Schema(
    {
      orderId: { type: String, required: true },
      userId: { type: String, required: true },
      amount: { type: Number, required: true },
      status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"],
        default: "PENDING",
      },
      transactionId: { type: String, required: true },
      paymentMethod: {
        type: String,
        enum: ["CARD", "COD", "PAYPAL"],
        required: true,
      },
    },
    { timestamps: true }
  ),
};

// Create connection handlers for each service with retry logic
const createServiceTests = async (serviceName, dbUri) => {
  logger.section(`Testing ${serviceName.toUpperCase()} Service Database`);

  // Get the appropriate MongoDB URI with fallbacks
  let uri;

  // Try service-specific environment variables first with different formats
  const envVars = [
    `${serviceName.toUpperCase()}_MONGODB_URI`,
    `${serviceName.toUpperCase()}_DB_URI`,
    `MONGODB_URI_${serviceName.toUpperCase()}`,
    "MONGODB_URI",
  ];

  for (const envVar of envVars) {
    if (process.env[envVar]) {
      uri = process.env[envVar];
      logger.info(
        `Using ${envVar} environment variable for database connection`
      );
      break;
    }
  }

  // Fall back to default if no environment variable was found
  if (!uri) {
    uri = dbUri;
    logger.warning(
      `No environment variable found for ${serviceName} database, using default: ${uri}`
    );
  }

  // Mask credentials in logs
  const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  logger.info(`Connecting to ${serviceName} database: ${maskedUri}`);

  // Add retry logic for connections
  let connection;
  let retryCount = 0;

  while (retryCount < CONFIG.connectRetryCount) {
    try {
      // Create a separate connection for this service
      connection = await mongoose.createConnection(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: CONFIG.timeout,
        connectTimeoutMS: CONFIG.timeout,
      });

      logger.success(`Connected to ${serviceName} database successfully`);
      break; // Connection successful, exit the retry loop
    } catch (err) {
      retryCount++;

      if (retryCount >= CONFIG.connectRetryCount) {
        logger.error(
          `Failed to connect to ${serviceName} database after ${CONFIG.connectRetryCount} attempts: ${err.message}`
        );
        return { serviceName, success: false, error: err.message };
      }

      logger.warning(
        `Connection attempt ${retryCount} failed, retrying in ${
          CONFIG.connectRetryDelay / 1000
        } seconds...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.connectRetryDelay)
      );
    }
  }

  try {
    // Create model using the appropriate schema
    const Model = connection.model(serviceName, schemas[serviceName]);

    // Run tests specific to this service
    const testResult = await runServiceTests(serviceName, Model);

    // Close connection when done
    await connection.close();
    logger.info(`Closed connection to ${serviceName} database`);

    return testResult;
  } catch (err) {
    // Ensure connection is closed even if tests fail
    if (connection) {
      try {
        await connection.close();
        logger.info(`Closed connection to ${serviceName} database after error`);
      } catch (closeErr) {
        logger.error(`Error closing database connection: ${closeErr.message}`);
      }
    }

    logger.error(`Error during ${serviceName} service tests: ${err.message}`);
    return { serviceName, success: false, error: err.message };
  }
};

// Run the specific tests for each service type
const runServiceTests = async (serviceName, Model) => {
  try {
    logger.info(`Running CRUD tests for ${serviceName} service...`);

    // Create test data
    const testObj = testData[serviceName]();

    // CREATE test
    logger.info("Testing CREATE operation...");
    const created = await Model.create(testObj);
    if (!created || !created._id) {
      throw new Error("Failed to create test document");
    }
    logger.success(
      `CREATE test passed. Created document with ID: ${created._id}`
    );

    // READ test
    logger.info("Testing READ operation...");
    const found = await Model.findById(created._id);
    if (
      !found ||
      !found._id ||
      found._id.toString() !== created._id.toString()
    ) {
      throw new Error("Failed to read test document");
    }
    logger.success("READ test passed. Document retrieved successfully");

    // UPDATE test
    logger.info("Testing UPDATE operation...");
    let updateField;
    switch (serviceName) {
      case "user":
        updateField = { name: `Updated Test User ${uuidv4().substring(0, 8)}` };
        break;
      case "restaurant":
        updateField = {
          description: `Updated description ${uuidv4().substring(0, 8)}`,
        };
        break;
      case "cart":
        updateField = { total: 19.99 };
        break;
      case "order":
        updateField = { status: "CONFIRMED" };
        break;
      case "payment":
        updateField = { status: "COMPLETED" };
        break;
      default:
        updateField = { updatedAt: new Date() };
    }

    const updated = await Model.findByIdAndUpdate(created._id, updateField, {
      new: true,
    });

    if (
      !updated ||
      Object.keys(updateField).some((key) => updated[key] !== updateField[key])
    ) {
      throw new Error("Failed to update test document");
    }
    logger.success("UPDATE test passed. Document updated successfully");

    // DELETE test
    if (CONFIG.cleanupAfterTest) {
      logger.info("Testing DELETE operation...");
      const deleted = await Model.findByIdAndDelete(created._id);
      if (!deleted) {
        throw new Error("Failed to delete test document");
      }
      logger.success("DELETE test passed. Document deleted successfully");
    } else {
      logger.warning(
        "DELETE test skipped. Test data will remain in the database"
      );
    }

    // Additional service-specific tests
    await runServiceSpecificTests(serviceName, Model, created._id);

    return { serviceName, success: true };
  } catch (err) {
    logger.error(`Test failed for ${serviceName} service: ${err.message}`);
    return { serviceName, success: false, error: err.message };
  }
};

// Additional service-specific tests
const runServiceSpecificTests = async (serviceName, Model, createdId) => {
  logger.info(`Running ${serviceName}-specific tests...`);

  try {
    switch (serviceName) {
      case "restaurant":
        // Test adding a menu item
        logger.info("Testing menu item addition...");
        const menuItem = testData.menuItem();
        const restaurantWithMenu = await Model.findByIdAndUpdate(
          createdId,
          { $push: { menu: menuItem } },
          { new: true }
        );

        if (
          !restaurantWithMenu ||
          !restaurantWithMenu.menu ||
          restaurantWithMenu.menu.length === 0
        ) {
          throw new Error("Failed to add menu item to restaurant");
        }
        logger.success("Menu item added successfully to restaurant");
        break;

      case "cart":
        // Test cart item addition and total recalculation
        logger.info("Testing cart item addition and total calculation...");
        const cartItem = testData.cartItem();
        const cartWithItem = await Model.findByIdAndUpdate(
          createdId,
          {
            $push: { items: cartItem },
            $set: { total: 19.98 }, // 9.99 * 2
          },
          { new: true }
        );

        if (
          !cartWithItem ||
          !cartWithItem.items ||
          cartWithItem.items.length === 0
        ) {
          throw new Error("Failed to add item to cart");
        }
        logger.success("Cart item added and total calculated successfully");
        break;

      case "order":
        // Test order status update
        logger.info("Testing order status update...");
        const updatedOrder = await Model.findByIdAndUpdate(
          createdId,
          {
            $set: {
              status: "PREPARING",
              statusHistory: [
                {
                  status: "PENDING",
                  timestamp: new Date(Date.now() - 3600000),
                },
                {
                  status: "CONFIRMED",
                  timestamp: new Date(Date.now() - 1800000),
                },
                { status: "PREPARING", timestamp: new Date() },
              ],
            },
          },
          { new: true }
        );

        if (!updatedOrder || updatedOrder.status !== "PREPARING") {
          throw new Error("Failed to update order status");
        }
        logger.success("Order status updated successfully");
        break;

      default:
        // No additional tests for other services
        break;
    }
  } catch (err) {
    logger.error(
      `Service-specific test failed for ${serviceName}: ${err.message}`
    );
    throw err;
  }
};

// Run database connection tests for all services
const runAllTests = async () => {
  logger.section("Starting Database Integration Tests");
  logger.info("Running tests on: " + new Date().toISOString());
  logger.info(`Node.js version: ${process.version}`);
  logger.info(`Mongoose version: ${mongoose.version}`);

  // Print any available environment variables for debugging (without sensitive info)
  logger.info("Available database-related environment variables:");
  Object.keys(process.env)
    .filter(
      (key) =>
        key.includes("MONGO") || key.includes("DB_") || key.includes("DATABASE")
    )
    .forEach((key) => {
      const value = process.env[key];
      // Mask any values that look like connection strings
      const maskedValue = value.includes("mongodb://")
        ? value.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
        : value;
      console.log(`  ${key}: ${maskedValue}`);
    });

  const startTime = Date.now();
  const results = [];

  // Test each service database connection and operations
  for (const [service, uri] of Object.entries(DEFAULT_DB_URIS)) {
    try {
      const result = await createServiceTests(service, uri);
      results.push(result);
    } catch (err) {
      logger.error(`Error running tests for ${service}: ${err.message}`);
      results.push({
        serviceName: service,
        success: false,
        error: err.message,
      });
    }
  }

  // Print summary
  logger.section("Test Summary");

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  console.log(`Total tests: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log(`Duration: ${(Date.now() - startTime) / 1000}s`);

  results.forEach((result) => {
    const status = result.success
      ? `${colors.green}PASSED${colors.reset}`
      : `${colors.red}FAILED${colors.reset}`;
    console.log(`${result.serviceName} service: ${status}`);
    if (!result.success && result.error) {
      console.log(`  - Error: ${result.error}`);
    }
  });

  if (failureCount > 0) {
    logger.section("Troubleshooting Tips");
    console.log("1. Make sure MongoDB is running and accessible");
    console.log("2. Check that connection strings in .env files are correct");
    console.log(
      "3. Verify network connectivity (especially if using Docker or remote databases)"
    );
    console.log(
      "4. Consider increasing the timeout values if connections are slow"
    );
    console.log(
      "5. Check MongoDB user permissions if authentication errors occur"
    );
  }

  return results;
};

// Handle unhandled promise rejections and exceptions
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Promise Rejection:");
  logger.error(reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:");
  logger.error(error);
  process.exit(1);
});

// Run the tests with proper error handling
runAllTests()
  .then((results) => {
    const failedTests = results.filter((r) => !r.success).length;
    process.exit(failedTests > 0 ? 1 : 0);
  })
  .catch((err) => {
    logger.error(`Fatal error: ${err.message}`);
    logger.error(err.stack);
    process.exit(1);
  });
