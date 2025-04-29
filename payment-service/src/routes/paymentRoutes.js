const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/auth");

// Apply authentication middleware to all routes except webhooks
router.use((req, res, next) => {
  if (req.path === "/webhook" || req.path === "/paypal-webhook") {
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

// PayPal Payment Routes
// Create PayPal order - enhanced for web and mobile support
router.post(
  "/paypal/create-order",
  [
    body("orderId").notEmpty(),
    body("amount").isFloat({ min: 0 }),
    body("userId").optional(),
    body("platform").optional().isIn(["web", "mobile"]),
  ],
  paymentController.createPayPalOrder
);

// Capture PayPal payment - make validation optional for mockPayPal testing
router.post(
  "/paypal/capture",
  [
    body("paypalOrderId").optional({ nullable: true }),
    body("platform").optional().isIn(["web", "mobile"]),
    body("mockPayPal").optional().isBoolean(),
  ],
  paymentController.capturePayPalPayment
);

// Get PayPal payment details
router.get(
  "/paypal/details/:paymentId",
  paymentController.getPayPalPaymentDetails
);

// Mobile-specific PayPal endpoints
router.post(
  "/mobile/paypal/create-order",
  [
    body("orderId").notEmpty(),
    body("amount").isFloat({ min: 0 }),
    body("userId").optional(),
  ],
  (req, res, next) => {
    // Force platform to mobile
    req.body.platform = "mobile";
    next();
  },
  paymentController.createPayPalOrder
);

router.post(
  "/mobile/paypal/notify",
  [body("paypalOrderId").optional(), body("status").optional()],
  (req, res, next) => {
    // Mobile app notification endpoint for payment status updates
    req.body.platform = "mobile";
    next();
  },
  paymentController.capturePayPalPayment
);

// Handle Stripe webhook - use raw body parsing only for this route
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

// Handle PayPal webhook
router.post(
  "/paypal-webhook",
  express.raw({ type: "application/json" }),
  paymentController.handlePayPalWebhook
);

// Get payment status
router.get("/:paymentId", paymentController.getPaymentStatus);

// Admin Routes
// Get all payments (admin only)
router.get("/admin/all", paymentController.getAllPayments);

// Add specific admin route for managing PayPal payments
router.post(
  "/admin/paypal/check-transaction",
  [body("paypalOrderId").notEmpty()],
  paymentController.checkPayPalTransaction
);

// Add a payment verification endpoint
router.get("/verify/:paymentId", paymentController.verifyPaymentStatus);

module.exports = router;
