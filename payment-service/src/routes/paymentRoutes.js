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

// Create payment intent
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

// Process payment (direct payment without Stripe)
router.post(
  "/process",
  [
    body("orderId").notEmpty(),
    body("amount").isNumeric(),
    body("cardDetails").isObject(),
  ],
  paymentController.createPayment
);

// Handle Stripe webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

// Get payment status
router.get("/order/:orderId", paymentController.getPaymentStatus);

module.exports = router;
