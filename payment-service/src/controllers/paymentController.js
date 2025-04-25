const Payment = require("../models/Payment");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");
const { validationResult } = require("express-validator");

// Create payment intent for Stripe
exports.createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, amount, userId } = req.body;

    // Create a payment record
    const payment = new Payment({
      orderId,
      userId,
      amount,
      status: "PENDING",
      paymentMethod: "CARD",
    });

    // Create a Stripe customer if not exists
    let customer = await stripe.customers.list({ email: req.body.email });
    if (customer.data.length === 0) {
      customer = await stripe.customers.create({
        email: req.body.email,
        metadata: {
          userId: userId,
        },
      });
    } else {
      customer = customer.data[0];
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      customer: customer.id,
      metadata: {
        orderId,
        userId,
      },
    });

    // Update payment record with Stripe details
    payment.stripePaymentIntentId = paymentIntent.id;
    payment.stripeCustomerId = customer.id;
    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res
      .status(500)
      .json({ message: "Error creating payment intent", error: error.message });
  }
};

// Handle Cash on Delivery payment
exports.processCODPayment = async (req, res) => {
  try {
    const { orderId, amount, userId } = req.body;

    if (!orderId || !amount) {
      return res
        .status(400)
        .json({ message: "Order ID and amount are required" });
    }

    // Create a payment record for COD
    const payment = new Payment({
      orderId,
      userId: userId || req.body.userId || "guest-user",
      amount,
      status: "PENDING",
      paymentMethod: "COD",
      transactionId: `cod_${Date.now()}`,
    });

    await payment.save();

    // Notify the order service to update order status
    try {
      await axios.patch(
        `${process.env.ORDER_SERVICE_URL}/api/order/${orderId}/status`,
        {
          status: "CONFIRMED",
        }
      );
    } catch (orderError) {
      console.error("Error updating order status:", orderError);
      // Continue processing even if order update fails
    }

    res.status(200).json({
      success: true,
      message: "COD payment processed successfully",
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Error processing COD payment:", error);
    res.status(500).json({
      success: false,
      message: "Error processing COD payment",
      error: error.message,
    });
  }
};

// Process payment (handles both card and COD)
exports.processPayment = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod, cardDetails } = req.body;

    // Validate required fields
    if (!orderId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Handle different payment methods
    if (paymentMethod === "COD") {
      return this.processCODPayment(req, res);
    }

    // For card payments, process using the mock payment function
    const paymentResult = await processPayment({
      orderId,
      amount,
      cardDetails,
    });

    // Create payment record
    const payment = new Payment({
      orderId,
      amount,
      status: paymentResult.success ? "COMPLETED" : "FAILED",
      transactionId: paymentResult.transactionId,
      paymentMethod: "CARD",
    });

    await payment.save();

    if (paymentResult.success) {
      res.status(200).json({
        success: true,
        paymentId: payment._id,
        transactionId: payment.transactionId,
        message: "Payment processed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: paymentResult.message,
      });
    }
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing payment",
    });
  }
};

// Handle Stripe webhook
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment status" });
  }
};

// Helper function to handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });
    if (!payment) return;

    payment.status = "SUCCESS";
    await payment.save();

    // Notify order service
    await axios.patch(
      `${process.env.ORDER_SERVICE_URL}/api/orders/${payment.orderId}/status`,
      {
        status: "CONFIRMED",
      }
    );
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

// Helper function to handle failed payment
async function handlePaymentFailure(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });
    if (!payment) return;

    payment.status = "FAILED";
    payment.error =
      paymentIntent.last_payment_error?.message || "Payment failed";
    await payment.save();

    // Notify order service
    await axios.patch(
      `${process.env.ORDER_SERVICE_URL}/api/orders/${payment.orderId}/status`,
      {
        status: "FAILED",
      }
    );
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

// Mock payment processing
const processPayment = async (paymentData) => {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // 80% success rate for testing
  const isSuccess = Math.random() > 0.2;

  return {
    success: isSuccess,
    transactionId: `tx_${Date.now()}`,
    message: isSuccess
      ? "Payment successful"
      : "Payment failed - Insufficient funds",
  };
};
