const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED"],
    default: "PENDING",
  },
  transactionId: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["CARD", "COD", "PAYPAL"],
    required: true,
  },
  // For Stripe payments
  stripePaymentIntentId: String,
  stripeCustomerId: String,

  // For PayPal payments
  paypalOrderId: String,
  paypalPaymentId: String,

  // Processing flag to prevent duplicate transactions
  processing: {
    type: Boolean,
    default: false,
  },

  // Metadata for additional information (platform, device, etc.)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // For error tracking
  error: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
paymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
