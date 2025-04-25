const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/auth");

// Apply authentication middleware to all routes except webhook
router.use((req, res, next) => {
  if (req.path === "/webhook") {
    next();
  } else {
    authMiddleware(req, res, next);
  }
});

// Create payment intent for Stripe
router.post(
  "/initiate",
  [
    body("orderId").notEmpty(),
    body("amount").isFloat({ min: 0 }),
    body("userId").notEmpty(),
    body("email").isEmail(),
  ],
  paymentController.createPaymentIntent
);

// Process payment (handles both card and COD)
router.post(
  "/process",
  [
    body("orderId").notEmpty(),
    body("amount").isNumeric(),
    body("paymentMethod").optional().isIn(["CARD", "COD", "PAYPAL"]),
  ],
  paymentController.processPayment
);

// Create PayPal order
router.post(
  "/paypal/create-order",
  [
    body("orderId").notEmpty(),
    body("amount").isFloat({ min: 0 }),
    body("userId").notEmpty(),
  ],
  paymentController.createPayPalOrder
);

// Capture PayPal payment
router.post(
  "/paypal/capture",
  [body("paypalOrderId").notEmpty()],
  paymentController.capturePayPalPayment
);

// Handle Stripe webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

// Get payment status
router.get("/:paymentId", paymentController.getPaymentStatus);

module.exports = router;
