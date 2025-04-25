const User = require("../models/User");
const mongoose = require("mongoose");

// Sample users for the application
const sampleUsers = [
  {
    email: "test@example.com",
    password: "password123",
    name: "Test User",
    role: "customer",
    isVerified: true,
    phone: "123-456-7890",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "12345",
      country: "USA",
    },
  },
  {
    email: "admin@mademe.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
    isVerified: true,
    phone: "987-654-3210",
    address: {
      street: "456 Admin Ave",
      city: "Adminville",
      state: "NY",
      zipCode: "54321",
      country: "USA",
    },
  },
];

// Function to seed the database with initial users
const seedUsers = async () => {
  try {
    // Check if we're in development mode or if seeding is forced
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.FORCE_SEED !== "true"
    ) {
      console.log("Skipping user seeding in non-development environment");
      return;
    }

    console.log("Starting user seeding process...");
    console.log(
      `MongoDB URI: ${process.env.MONGODB_URI.replace(
        /\/\/([^:]+):([^@]+)@/,
        "//***:***@"
      )}`
    ); // Hide credentials in logs

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB is not connected. Cannot seed users.");
      return;
    }

    try {
      // Check if users already exist
      const userCount = await User.countDocuments();
      console.log(`Found ${userCount} existing users`);

      if (userCount > 0) {
        console.log(
          `Database already has ${userCount} users. Skipping seeding.`
        );
        return;
      }

      // Create users
      for (const userData of sampleUsers) {
        try {
          const existingUser = await User.findOne({ email: userData.email });

          if (!existingUser) {
            const newUser = new User(userData);
            await newUser.save();
            console.log(
              `Created sample user: ${userData.email} (${userData.role})`
            );
          } else {
            console.log(`User ${userData.email} already exists`);
          }
        } catch (userError) {
          console.error(
            `Error creating user ${userData.email}:`,
            userError.message
          );
        }
      }

      console.log("Sample users created successfully");
    } catch (dbError) {
      if (dbError.name === "MongoServerError" && dbError.code === 13) {
        console.error(
          "MongoDB Authentication Error: Please check your username and password in the connection string"
        );
        console.error(
          "Hint: Update the MONGODB_URI in your .env file with the correct credentials"
        );
      } else {
        console.error("Database operation error:", dbError.message);
      }
    }
  } catch (error) {
    console.error("Error seeding users:", error.message);
    console.error("Stack trace:", error.stack);
  }
};

module.exports = { seedUsers };
