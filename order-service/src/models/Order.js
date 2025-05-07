const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

// Add this new schema for delivery tracking
const locationSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  restaurantId: {
    type: String,
    required: true,
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: true,
  },
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
  restaurantResponse: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED"],
    default: "PENDING",
  },
  rejectionReason: {
    type: String,
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    // Add address coordinates for mapping
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  specialInstructions: {
    type: String,
    default: "",
  },
  paymentId: {
    type: String,
  },
  // Enhanced driver information
  delivery: {
    driverId: {
      type: String,
    },
    driverName: {
      type: String,
    },
    driverPhone: {
      type: String,
    },
    assignedAt: {
      type: Date,
    },
    estimatedDeliveryTime: {
      type: Date,
    },
    actualDeliveryTime: {
      type: Date,
    },
    currentLocation: locationSchema,
    locationHistory: [locationSchema],
    deliveryNotes: {
      type: String,
    },
  },
  // Admin-specific fields
  adminCreated: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: String,
    // This can store the admin user ID who created the order
  },
  adminNotes: {
    type: String,
    // Internal notes visible only to admins
  },
  statusHistory: [
    {
      status: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      updatedBy: String, // User or admin ID who updated the status
    },
  ],
  lastModifiedBy: {
    type: String,
    // ID of the user who last modified the order
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Track status changes for better admin auditing
orderSchema.pre("save", function (next) {
  // If the status has changed, add to status history
  if (this.isModified("status")) {
    // Create entry in statusHistory (assuming updatedBy might be set elsewhere)
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this.lastModifiedBy || "system", // Default to "system" if no user specified
    });
  }

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Order", orderSchema);
