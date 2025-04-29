const Payment = require("../models/Payment");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");
const { validationResult } = require("express-validator");
const paypal = require("@paypal/checkout-server-sdk");
const logger = require("../utils/logger");

/**
 * Creates and returns a PayPal HTTP client with the appropriate environment
 * Based on PayPal's official integration guidelines
 */
function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  // Check if in mock mode - for development without PayPal credentials
  if (process.env.MOCK_PAYPAL === "true") {
    logger.info("Using mock PayPal client for development");
    return {
      execute: async () => {
        return {
          result: {
            id: `mock-order-${Date.now()}`,
            status: "COMPLETED",
            links: [
              {
                rel: "approve",
                href: `${
                  process.env.FRONTEND_URL || "http://localhost:5173"
                }/payment/success?paymentId=mock-payment-${Date.now()}&PayerID=MOCK-PAYER&token=MOCK-${Date.now()}&mockPayPal=true`,
              },
            ],
            purchase_units: [
              {
                payments: {
                  captures: [
                    {
                      id: `mock-capture-${Date.now()}`,
                    },
                  ],
                },
              },
            ],
          },
        };
      },
    };
  }

  // Verify credentials are available
  if (!clientId || !clientSecret) {
    logger.error(
      "Missing PayPal credentials - PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set"
    );
    throw new Error(
      "PayPal credentials missing. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET."
    );
  }

  logger.info("Initializing PayPal client with provided credentials");

  // Create the environment for the client
  // Use sandbox for development and testing, LiveEnvironment for production
  let environment;
  if (process.env.NODE_ENV === "production") {
    environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
    logger.info("Using PayPal LIVE environment");
  } else {
    environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    logger.info("Using PayPal SANDBOX environment");
  }

  // Create and return the PayPal HTTP client
  return new paypal.core.PayPalHttpClient(environment);
}

// For checking PayPal setup
exports.checkPayPalSetup = async (req, res) => {
  try {
    // Check if PayPal SDK is available
    if (!paypal) {
      return res.status(500).json({
        success: false,
        message: "PayPal SDK not available",
        details: "PayPal SDK might not be installed or imported correctly",
      });
    }

    // Check for environment variables
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        message: "PayPal credentials missing",
        details:
          "PAYPAL_CLIENT_ID and/or PAYPAL_CLIENT_SECRET environment variables are not set",
      });
    }

    // Try to create a client to verify credentials format
    try {
      const environment = new paypal.core.SandboxEnvironment(
        clientId,
        clientSecret
      );
      const client = new paypal.core.PayPalHttpClient(environment);

      return res.json({
        success: true,
        message: "PayPal setup looks good",
        clientIdLength: clientId.length,
        clientSecretLength: clientSecret.length,
      });
    } catch (setupError) {
      return res.status(500).json({
        success: false,
        message: "Error creating PayPal client with provided credentials",
        error: setupError.message,
      });
    }
  } catch (error) {
    logger.error("Error checking PayPal setup:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking PayPal setup",
      error: error.message,
    });
  }
};

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

// Create a PayPal order based on official PayPal integration guidelines
exports.createPayPalOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const { orderId, amount, userId } = req.body;

    if (!orderId || !amount) {
      logger.error("Missing required fields for PayPal order:", {
        orderId,
        amount,
      });
      return res.status(400).json({
        message: "Missing required fields: orderId and amount are required",
        success: false,
      });
    }

    logger.info(
      `Creating PayPal order for orderId: ${orderId}, amount: ${amount}`
    );

    // Create payment record in our database (initial state: PENDING)
    const payment = new Payment({
      orderId,
      userId: userId || "guest-user",
      amount,
      status: "PENDING",
      paymentMethod: "PAYPAL",
      transactionId: `paypal_init_${Date.now()}`,
    });

    // Save the payment record to get an ID before proceeding
    await payment.save();

    // If mock mode is enabled, create a mock PayPal order
    if (process.env.MOCK_PAYPAL === "true") {
      logger.info("Using mock mode for PayPal order creation");

      // Generate mock PayPal order ID
      payment.paypalOrderId = `MOCK-${Date.now()}`;
      await payment.save();

      // Create approval URL that will redirect to our success page with all needed parameters
      const approvalUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/payment/success?paymentId=${payment._id}&PayerID=MOCK-PAYER&token=${
        payment.paypalOrderId
      }&mockPayPal=true`;

      logger.info(`Generated mock approval URL: ${approvalUrl}`);

      return res.json({
        success: true,
        paymentId: payment._id,
        paypalOrderId: payment.paypalOrderId,
        approvalUrl: approvalUrl,
        mockMode: true,
      });
    }

    // For non-mock mode, create a real PayPal order
    try {
      // Get PayPal client
      const paypalClient = getPayPalClient();

      // Create order request following PayPal's order structure
      const request = new paypal.orders.OrdersCreateRequest();

      // Set request headers
      request.prefer("return=representation");

      // Build the order object according to PayPal's API
      request.requestBody({
        intent: "CAPTURE", // Set intent to capture payment immediately upon approval
        purchase_units: [
          {
            reference_id: orderId, // Reference to our internal order
            description: `Order #${orderId}`,
            amount: {
              currency_code: "USD",
              value: amount.toString(), // PayPal expects a string for the amount
            },
          },
        ],
        application_context: {
          brand_name: "Food Delivery App",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW", // Display "Pay Now" on the PayPal checkout page
          return_url: `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/payment/success`,
          cancel_url: `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/payment/cancel`,
        },
      });

      // Execute the request
      logger.info("Executing PayPal OrdersCreateRequest...");
      const response = await paypalClient.execute(request);
      logger.info("PayPal order created successfully:", response.result.id);

      // Update payment record with PayPal order ID
      payment.paypalOrderId = response.result.id;
      await payment.save();

      // Find the approval URL in the HATEOAS links
      const approvalUrl = response.result.links.find(
        (link) => link.rel === "approve"
      ).href;

      logger.info(`Generated PayPal approval URL: ${approvalUrl}`);

      return res.json({
        success: true,
        paymentId: payment._id,
        paypalOrderId: response.result.id,
        approvalUrl: approvalUrl,
      });
    } catch (paypalError) {
      logger.error("Error creating PayPal order:", paypalError);

      // If PayPal API fails, fall back to mock mode as a last resort
      logger.info("Falling back to mock mode due to PayPal API error");

      // Generate mock PayPal order ID for fallback
      payment.paypalOrderId = `FALLBACK-${Date.now()}`;
      await payment.save();

      // Create fallback approval URL
      const fallbackApprovalUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/payment/success?paymentId=${payment._id}&PayerID=FALLBACK-PAYER&token=${
        payment.paypalOrderId
      }&mockPayPal=true`;

      return res.json({
        success: true,
        paymentId: payment._id,
        paypalOrderId: payment.paypalOrderId,
        approvalUrl: fallbackApprovalUrl,
        fallbackMode: true,
        originalError: paypalError.message,
      });
    }
  } catch (error) {
    logger.error("Unhandled error in createPayPalOrder:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating PayPal order",
      error: error.message,
    });
  }
};

// Capture a PayPal payment according to PayPal's official guidelines
exports.capturePayPalPayment = async (req, res) => {
  try {
    const { paypalOrderId, PayerID, mockPayPal, paymentId, orderId } = req.body;

    logger.info(
      `Capturing PayPal payment: paypalOrderId=${paypalOrderId}, PayerID=${PayerID}, paymentId=${paymentId}, mockPayPal=${mockPayPal}`
    );

    // Verify we have the necessary data
    if (!paypalOrderId && !paymentId) {
      return res.status(400).json({
        success: false,
        message: "PayPal order ID (token) or payment ID is required",
      });
    }

    // Find the payment record in our database
    let payment;

    // Try to find by paypalOrderId first
    if (paypalOrderId) {
      payment = await Payment.findOne({ paypalOrderId });
    }

    // If not found and paymentId is provided, try that instead
    if (!payment && paymentId) {
      payment = await Payment.findById(paymentId);
    }

    // If still not found but orderId is provided, find by orderId
    if (!payment && orderId) {
      payment = await Payment.findOne({
        orderId,
        paymentMethod: "PAYPAL",
        status: "PENDING",
      });
    }

    if (!payment) {
      logger.error(
        `Payment record not found for paypalOrderId: ${paypalOrderId}, paymentId: ${paymentId}, orderId: ${orderId}`
      );
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    logger.info(
      `Found payment record: ${payment._id} for order: ${payment.orderId}`
    );

    // Only capture if payment is still pending
    if (payment.status !== "PENDING") {
      logger.info(
        `Payment ${payment._id} already processed, status: ${payment.status}`
      );
      return res.json({
        success: true,
        message: "Payment already processed",
        paymentId: payment._id,
        status: payment.status,
      });
    }

    // Add a processing flag to prevent race conditions
    // Check if this payment is already being processed
    if (payment.processing) {
      logger.info(`Payment ${payment._id} is already being processed`);
      return res.json({
        success: true,
        message: "Payment is already being processed",
        paymentId: payment._id,
        status: "PROCESSING",
      });
    }

    // Set processing flag
    payment.processing = true;
    await payment.save();

    try {
      // Handle mock payments
      if (
        mockPayPal === true ||
        paypalOrderId?.includes("MOCK-") ||
        paypalOrderId?.includes("FALLBACK-")
      ) {
        logger.info(
          `Processing mock PayPal payment for order: ${payment.orderId}`
        );

        // Update payment status
        payment.status = "COMPLETED";
        payment.processing = false; // Clear processing flag
        payment.paypalPaymentId = `MOCK-CAPTURE-${Date.now()}`;
        await payment.save();

        // Notify order service to update order status
        try {
          await axios.patch(
            `${
              process.env.ORDER_SERVICE_URL || "http://localhost:5001"
            }/api/order/${payment.orderId}/status`,
            { status: "CONFIRMED" }
          );
          logger.info(`Order ${payment.orderId} status updated to CONFIRMED`);
        } catch (orderError) {
          logger.error(
            `Error updating order status for ${payment.orderId}:`,
            orderError
          );
        }

        return res.json({
          success: true,
          message: "Mock payment successfully captured",
          paymentId: payment._id,
          mockPayment: true,
        });
      }

      // For real PayPal payments, proceed with actual capture
      try {
        logger.info(`Executing PayPal capture for orderId: ${paypalOrderId}`);

        const paypalClient = getPayPalClient();
        const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);

        // PayPal suggests an empty request body for simple captures
        request.requestBody({});

        // Execute the capture request
        const captureResponse = await paypalClient.execute(request);

        logger.info(
          `PayPal capture successful, status: ${captureResponse.result.status}`
        );

        // Update payment record in database
        payment.status = "COMPLETED";
        payment.processing = false; // Clear processing flag
        payment.paypalPaymentId =
          captureResponse.result.purchase_units[0].payments.captures[0].id;
        await payment.save();

        // Notify order service to update order status
        try {
          await axios.patch(
            `${
              process.env.ORDER_SERVICE_URL || "http://localhost:5001"
            }/api/order/${payment.orderId}/status`,
            { status: "CONFIRMED" }
          );
          logger.info(`Order ${payment.orderId} status updated to CONFIRMED`);
        } catch (orderError) {
          logger.error(
            `Error updating order status for ${payment.orderId}:`,
            orderError
          );
        }

        return res.json({
          success: true,
          message: "Payment successfully captured",
          paymentId: payment._id,
        });
      } catch (paypalError) {
        logger.error("Error capturing PayPal payment:", paypalError);

        // Use fallback in development environments
        if (process.env.NODE_ENV !== "production") {
          payment.status = "COMPLETED";
          payment.processing = false; // Clear processing flag
          payment.paypalPaymentId = `FALLBACK-CAPTURE-${Date.now()}`;
          await payment.save();

          // Notify the order service
          try {
            await axios.patch(
              `${
                process.env.ORDER_SERVICE_URL || "http://localhost:5001"
              }/api/order/${payment.orderId}/status`,
              { status: "CONFIRMED" }
            );
            logger.info(
              `Order ${payment.orderId} status updated to CONFIRMED (fallback)`
            );
          } catch (orderError) {
            logger.error(
              `Error updating order status in fallback:`,
              orderError
            );
          }

          return res.json({
            success: true,
            message: "Payment processed with fallback method",
            paymentId: payment._id,
            fallback: true,
          });
        }

        // Clear processing flag if error occurs
        payment.processing = false;
        await payment.save();

        return res.status(500).json({
          success: false,
          message: "Error capturing PayPal payment",
          error: paypalError.message,
        });
      }
    } catch (error) {
      // Make sure to clear the processing flag if there's an error
      payment.processing = false;
      await payment.save();
      throw error;
    }
  } catch (error) {
    logger.error("Unexpected error in capturePayPalPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Unexpected error processing payment",
      error: error.message,
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

// Get all payments (admin only)
exports.getAllPayments = async (req, res) => {
  try {
    const { status, paymentMethod, startDate, endDate } = req.query;

    // Build query based on filters
    let query = {};

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    // Fetch payments with sorting by latest first
    const payments = await Payment.find(query).sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    logger.error("Error fetching payments:", error);
    res.status(500).json({
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// Check a specific PayPal transaction - admin function
exports.checkPayPalTransaction = async (req, res) => {
  try {
    const { paypalOrderId } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({
        success: false,
        message: "PayPal order ID is required",
      });
    }

    // Find the payment in our database
    const payment = await Payment.findOne({ paypalOrderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found in database",
      });
    }

    // Get details from PayPal API
    try {
      const paypalClient = getPayPalClient();
      const request = new paypal.orders.OrdersGetRequest(paypalOrderId);
      const paypalResponse = await paypalClient.execute(request);

      return res.json({
        success: true,
        databaseRecord: payment,
        paypalDetails: paypalResponse.result,
      });
    } catch (paypalError) {
      logger.error("Error fetching PayPal transaction details:", paypalError);
      return res.status(500).json({
        success: false,
        message: "Error fetching PayPal transaction details",
        databaseRecord: payment,
        error: paypalError.message,
      });
    }
  } catch (error) {
    logger.error("Error checking PayPal transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error checking PayPal transaction",
      error: error.message,
    });
  }
};

// Verify payment status with more detail
exports.verifyPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    // For PayPal payments, get additional details from PayPal
    if (payment.paymentMethod === "PAYPAL" && payment.paypalOrderId) {
      try {
        const paypalClient = getPayPalClient();
        const request = new paypal.orders.OrdersGetRequest(
          payment.paypalOrderId
        );
        const paypalResponse = await paypalClient.execute(request);

        return res.json({
          success: true,
          payment: payment,
          paypalDetails: {
            status: paypalResponse.result.status,
            payer: paypalResponse.result.payer,
            intent: paypalResponse.result.intent,
            createTime: paypalResponse.result.create_time,
            updateTime: paypalResponse.result.update_time,
          },
        });
      } catch (paypalError) {
        // If we can't reach PayPal, just return the payment data we have
        logger.error("Error fetching PayPal details:", paypalError);
        return res.json({
          success: true,
          payment: payment,
          paypalDetailsError: "Could not retrieve details from PayPal API",
        });
      }
    }

    // For other payment methods, just return payment data
    res.json({
      success: true,
      payment: payment,
    });
  } catch (error) {
    logger.error("Error verifying payment status:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment status",
      error: error.message,
    });
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
