const Payment = require("../models/Payment");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");
const { validationResult } = require("express-validator");
const paypal = require("@paypal/checkout-server-sdk");
const logger = require("../utils/logger");

// PayPal client setup
function getPayPalClient() {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error("Missing PayPal credentials in environment variables");
      throw new Error("PayPal credentials are missing");
    }

    logger.info("Setting up PayPal client with provided credentials");

    // Use the sandbox environment for development
    const environment = new paypal.core.SandboxEnvironment(
      clientId,
      clientSecret
    );
    // Use the live environment for production
    // const environment = new paypal.core.LiveEnvironment(clientId, clientSecret);

    return new paypal.core.PayPalHttpClient(environment);
  } catch (error) {
    logger.error("Error creating PayPal client:", error);
    throw error;
  }
}

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
      transactionId: `card_intent_${Date.now()}`,
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
    logger.error("Error creating payment intent:", error);
    res
      .status(500)
      .json({ message: "Error creating payment intent", error: error.message });
  }
};

// Create a PayPal order
exports.createPayPalOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, amount, userId } = req.body;

    if (!orderId || !amount || !userId) {
      return res.status(400).json({
        message: "Missing required fields",
        success: false,
      });
    }

    // Create a PayPal order
    const paypalClient = getPayPalClient();
    const request = new paypal.orders.OrdersCreateRequest();

    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
          reference_id: orderId,
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      },
    });

    const paypalOrder = await paypalClient.execute(request);

    // Create payment record in our database
    const payment = new Payment({
      orderId,
      userId,
      amount,
      status: "PENDING",
      paymentMethod: "PAYPAL",
      transactionId: `paypal_${Date.now()}`,
      paypalOrderId: paypalOrder.result.id,
    });

    await payment.save();

    // Get the approval URL from the links array
    const approvalUrl = paypalOrder.result.links.find(
      (link) => link.rel === "approve"
    ).href;

    res.json({
      success: true,
      paymentId: payment._id,
      paypalOrderId: paypalOrder.result.id,
      approvalUrl: approvalUrl,
    });
  } catch (error) {
    logger.error("Error creating PayPal order:", error);
    res.status(500).json({
      message: "Error creating PayPal order",
      error: error.message,
      success: false,
    });
  }
};

// Capture a PayPal payment
exports.capturePayPalPayment = async (req, res) => {
  try {
    const { paypalOrderId } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({
        message: "PayPal order ID is required",
        success: false,
      });
    }

    // Find the payment record in our database
    const payment = await Payment.findOne({ paypalOrderId });

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found",
        success: false,
      });
    }

    // Only capture if the payment is pending
    if (payment.status !== "PENDING") {
      return res.json({
        success: true,
        message: "Payment already processed",
        paymentId: payment._id,
      });
    }

    // Capture the PayPal payment
    const paypalClient = getPayPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const captureResponse = await paypalClient.execute(request);

    // Update payment status
    payment.status = "COMPLETED";
    payment.paypalPaymentId =
      captureResponse.result.purchase_units[0].payments.captures[0].id;
    await payment.save();

    // Notify the order service to update order status
    try {
      await axios.patch(
        `${process.env.ORDER_SERVICE_URL}/api/order/${payment.orderId}/status`,
        {
          status: "CONFIRMED",
        }
      );
      logger.info(`Order ${payment.orderId} status updated to CONFIRMED`);
    } catch (orderError) {
      logger.error("Error updating order status:", orderError);
      // Continue processing even if order update fails
    }

    res.json({
      success: true,
      message: "Payment successfully captured",
      paymentId: payment._id,
    });
  } catch (error) {
    logger.error("Error capturing PayPal payment:", error);
    res.status(500).json({
      message: "Error capturing PayPal payment",
      error: error.message,
      success: false,
    });
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
      logger.info(`Order ${orderId} status updated to CONFIRMED`);
    } catch (orderError) {
      logger.error("Error updating order status:", orderError);
      // Continue processing even if order update fails
    }

    res.status(200).json({
      success: true,
      message: "COD payment processed successfully",
      paymentId: payment._id,
    });
  } catch (error) {
    logger.error("Error processing COD payment:", error);
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
      return exports.processCODPayment(req, res);
    } else if (paymentMethod === "PAYPAL") {
      return exports.createPayPalOrder(req, res);
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
      userId: req.body.userId || "guest-user",
      amount,
      status: paymentResult.success ? "COMPLETED" : "FAILED",
      transactionId: paymentResult.transactionId,
      paymentMethod: "CARD",
    });

    await payment.save();

    if (paymentResult.success) {
      // Notify the order service to update order status
      try {
        await axios.patch(
          `${process.env.ORDER_SERVICE_URL}/api/order/${orderId}/status`,
          {
            status: "CONFIRMED",
          }
        );
        logger.info(`Order ${orderId} status updated to CONFIRMED`);
      } catch (orderError) {
        logger.error("Error updating order status:", orderError);
        // Continue processing even if order update fails
      }

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
    logger.error("Payment error:", error);
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
    logger.error("Error fetching payment status:", error);
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

    payment.status = "COMPLETED";
    await payment.save();

    // Notify order service
    await axios.patch(
      `${process.env.ORDER_SERVICE_URL}/api/order/${payment.orderId}/status`,
      {
        status: "CONFIRMED",
      }
    );
    logger.info(
      `Order ${payment.orderId} status updated to CONFIRMED after successful payment`
    );
  } catch (error) {
    logger.error("Error handling payment success:", error);
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
      `${process.env.ORDER_SERVICE_URL}/api/order/${payment.orderId}/status`,
      {
        status: "FAILED",
      }
    );
    logger.info(
      `Order ${payment.orderId} status updated to FAILED after payment failure`
    );
  } catch (error) {
    logger.error("Error handling payment failure:", error);
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
