/**
 * PayPal Gateway Integration using the latest PayPal SDK
 */

const Payment = require("../models/Payment");
const axios = require("axios");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

// Using the custom PayPal client with rate-limiting and retry capability
const paypalUtils = require("../utils/paypal");

// Create a PayPal order
exports.createPayPalOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const { orderId, amount, userId, items = [] } = req.body;
    logger.info(
      `Creating PayPal order for order: ${orderId}, amount: $${amount}`
    );

    // Create payment record in database
    const payment = new Payment({
      orderId,
      userId: userId || "guest-user",
      amount,
      status: "PENDING",
      paymentMethod: "PAYPAL",
      transactionId: `paypal_init_${Date.now()}`,
      metadata: { createdAt: new Date().toISOString() },
    });
    await payment.save();
    logger.info(`Created payment record with ID: ${payment._id}`);

    // Create PayPal Order
    const request = paypalUtils.client.ordersCreate({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          description: `Order #${orderId} for MadeME Food Delivery`,
          amount: {
            currency_code: "USD",
            value: amount.toString(),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: amount.toString(),
              },
            },
          },
          items: [
            {
              name: "Food Order",
              description: `Order #${orderId}`,
              unit_amount: {
                currency_code: "USD",
                value: amount.toString(),
              },
              quantity: "1",
              category: "DIGITAL_GOODS",
            },
          ],
        },
      ],
      application_context: {
        brand_name: "MadeME Food Delivery",
        landing_page: "LOGIN",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/payment/success?orderId=${orderId}&paymentId=${payment._id}`,
        cancel_url: `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/payment/cancel`,
      },
    });

    // Execute the request to create the order
    logger.info("Sending request to PayPal to create order");
    const response = await request;
    logger.info(
      `PayPal order created successfully with ID: ${response.result.id}`
    );

    // Update payment record with PayPal order ID
    payment.paypalOrderId = response.result.id;
    await payment.save();
    logger.info(
      `Updated payment record with PayPal order ID: ${response.result.id}`
    );

    // Find the approval URL in the links array
    const approvalUrl = response.result.links.find(
      (link) => link.rel === "approve"
    ).href;
    logger.info(`PayPal approval URL: ${approvalUrl}`);

    // Return response with appropriate data
    return res.json({
      success: true,
      paymentId: payment._id,
      paypalOrderId: response.result.id,
      approvalUrl: approvalUrl,
    });
  } catch (error) {
    logger.error("Error creating PayPal order:", error);
    logger.error(error.stack);
    return res.status(500).json({
      success: false,
      message: "Error creating PayPal order",
      error: error.message,
    });
  }
};

// Capture a PayPal payment
exports.capturePayPalPayment = async (req, res) => {
  try {
    const { paypalOrderId, PayerID } = req.body;
    logger.info(
      `Capturing PayPal payment: Order ID ${paypalOrderId}, Payer ID ${PayerID}`
    );

    if (!paypalOrderId) {
      return res.status(400).json({
        success: false,
        message: "PayPal order ID is required",
      });
    }

    // Find the payment record in database
    const payment = await Payment.findOne({ paypalOrderId });
    if (!payment) {
      logger.error(
        `Payment record not found for PayPal order: ${paypalOrderId}`
      );
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Check if payment is already completed
    if (payment.status === "COMPLETED") {
      logger.info(
        `Payment ${payment._id} already processed, status: COMPLETED`
      );
      return res.json({
        success: true,
        message: "Payment already processed",
        paymentId: payment._id,
        orderId: payment.orderId,
        status: payment.status,
      });
    }

    // Mark payment as processing to prevent duplicate processing
    payment.status = "PROCESSING";
    payment.metadata = {
      ...payment.metadata,
      processingStarted: new Date().toISOString(),
    };
    await payment.save();
    logger.info(`Marked payment ${payment._id} as PROCESSING`);

    // For mock PayPal in development (useful for testing)
    if (
      process.env.MOCK_PAYPAL === "true" &&
      process.env.NODE_ENV === "development"
    ) {
      logger.info(`Using mock PayPal processing for order ${paypalOrderId}`);

      // Update payment record for mock processing
      payment.status = "COMPLETED";
      payment.paypalPaymentId = `mock_${Date.now()}`;
      payment.metadata = {
        ...payment.metadata,
        captureId: `mock_capture_${Date.now()}`,
        paypalStatus: "COMPLETED",
        capturedAt: new Date().toISOString(),
        isMock: true,
      };
      await payment.save();

      // Notify order service
      try {
        await axios.patch(
          `${
            process.env.ORDER_SERVICE_URL || "http://localhost:5001"
          }/api/orders/${payment.orderId}/status`,
          { status: "CONFIRMED" },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization,
            },
          }
        );
        logger.info(
          `Order ${payment.orderId} status updated to CONFIRMED (mock)`
        );
      } catch (orderError) {
        logger.error(
          `Error updating order status (mock): ${orderError.message}`
        );
      }

      return res.json({
        success: true,
        message: "Mock payment successfully captured",
        paymentId: payment._id,
        orderId: payment.orderId,
        captureId: payment.metadata.captureId,
        status: "COMPLETED",
      });
    }

    try {
      // Get PayPal client and create capture request
      const request = paypalUtils.client.ordersCapture(paypalOrderId);
      request.requestBody({}); // Empty request body is recommended for standard captures

      // Execute the capture request
      logger.info(
        `Sending capture request to PayPal for order ${paypalOrderId}`
      );
      const captureResponse = await request;
      logger.info(
        `PayPal capture successful, status: ${captureResponse.result.status}`
      );

      // Get the capture ID from the response
      const captureId =
        captureResponse.result.purchase_units[0].payments.captures[0].id;

      // Update payment record
      payment.status = "COMPLETED";
      payment.paypalPaymentId = captureId;
      payment.metadata = {
        ...payment.metadata,
        captureId,
        paypalStatus: captureResponse.result.status,
        capturedAt: new Date().toISOString(),
      };
      await payment.save();
      logger.info(`Updated payment ${payment._id} status to COMPLETED`);

      // Notify order service to update order status
      try {
        await axios.patch(
          `${
            process.env.ORDER_SERVICE_URL || "http://localhost:5001"
          }/api/orders/${payment.orderId}/status`,
          { status: "CONFIRMED" },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization,
            },
          }
        );
        logger.info(`Order ${payment.orderId} status updated to CONFIRMED`);
      } catch (orderError) {
        logger.error(`Error updating order status: ${orderError.message}`);
        // Continue with payment success even if order update fails
      }

      // Return success response
      return res.json({
        success: true,
        message: "Payment successfully captured",
        paymentId: payment._id,
        orderId: payment.orderId,
        captureId,
        status: "COMPLETED",
      });
    } catch (captureError) {
      // Handle capture error
      logger.error(`Error capturing PayPal payment: ${captureError.message}`);
      logger.error(captureError.stack);

      // Update payment record to reflect failure
      payment.status = "FAILED";
      payment.error = captureError.message;
      payment.metadata = {
        ...payment.metadata,
        failedAt: new Date().toISOString(),
        errorDetails: captureError.toString(),
      };
      await payment.save();
      logger.info(`Updated payment ${payment._id} status to FAILED`);

      return res.status(500).json({
        success: false,
        message: "Failed to capture PayPal payment",
        error: captureError.message,
      });
    }
  } catch (error) {
    logger.error(`Unexpected error in capturePayPalPayment: ${error.message}`);
    logger.error(error.stack);
    return res.status(500).json({
      success: false,
      message: "Unexpected error processing payment",
      error: error.message,
    });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        method: payment.paymentMethod,
        orderId: payment.orderId,
        createdAt: payment.createdAt,
        metadata: payment.metadata,
      },
    });
  } catch (error) {
    logger.error(`Error getting payment status: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error retrieving payment status",
      error: error.message,
    });
  }
};

// Verify payment status with PayPal
exports.verifyPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Find payment in database
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // If it's not a PayPal payment, just return the current status
    if (payment.paymentMethod !== "PAYPAL") {
      return res.json({
        success: true,
        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          method: payment.paymentMethod,
          orderId: payment.orderId,
        },
      });
    }

    // For PayPal payments, check the status with PayPal if we have an order ID
    if (payment.paypalOrderId) {
      try {
        const request = paypalUtils.client.ordersGet(payment.paypalOrderId);
        const response = await request;

        const paypalStatus = response.result.status;
        logger.info(
          `PayPal order ${payment.paypalOrderId} status from PayPal: ${paypalStatus}`
        );

        // If our status doesn't match PayPal's, update our record
        if (
          (paypalStatus === "COMPLETED" && payment.status !== "COMPLETED") ||
          (paypalStatus === "APPROVED" && payment.status === "PENDING")
        ) {
          logger.info(
            `Updating payment ${payment._id} status from ${payment.status} to COMPLETED based on PayPal verification`
          );

          payment.status = "COMPLETED";
          payment.metadata = {
            ...payment.metadata,
            verifiedAt: new Date().toISOString(),
            paypalStatus: paypalStatus,
          };
          await payment.save();

          // Notify order service if we're updating to COMPLETED
          try {
            await axios.patch(
              `${
                process.env.ORDER_SERVICE_URL || "http://localhost:5001"
              }/api/orders/${payment.orderId}/status`,
              { status: "CONFIRMED" },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: req.headers.authorization,
                },
              }
            );
            logger.info(
              `Updated order ${payment.orderId} status to CONFIRMED via verification`
            );
          } catch (orderError) {
            logger.error(
              `Error updating order status via verification: ${orderError.message}`
            );
          }
        }

        return res.json({
          success: true,
          verified: true,
          payment: {
            id: payment._id,
            status: payment.status,
            amount: payment.amount,
            method: payment.paymentMethod,
            orderId: payment.orderId,
          },
          paypalStatus: paypalStatus,
        });
      } catch (paypalError) {
        logger.error(`Error verifying with PayPal: ${paypalError.message}`);
        return res.json({
          success: true,
          verified: false,
          payment: {
            id: payment._id,
            status: payment.status,
            amount: payment.amount,
            method: payment.paymentMethod,
            orderId: payment.orderId,
          },
          error: paypalError.message,
        });
      }
    }

    // If we don't have a PayPal order ID, just return our current info
    return res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        method: payment.paymentMethod,
        orderId: payment.orderId,
      },
    });
  } catch (error) {
    logger.error(`Error verifying payment status: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment status",
      error: error.message,
    });
  }
};

// Handle PayPal webhook
exports.handlePayPalWebhook = async (req, res) => {
  try {
    // Get the raw body as a string
    const paypalBody = req.body.toString("utf8");
    logger.info("Received PayPal webhook event");

    // Verify the webhook is from PayPal - in production, validate the webhook signature
    // https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature

    // Parse the webhook payload
    const webhookEvent = JSON.parse(paypalBody);
    logger.info(`PayPal webhook event type: ${webhookEvent.event_type}`);

    // Handle different event types
    switch (webhookEvent.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        // Payment capture completed successfully
        await handlePaymentCaptureCompleted(webhookEvent);
        break;

      case "PAYMENT.CAPTURE.DENIED":
        // Payment capture denied
        await handlePaymentCaptureDenied(webhookEvent);
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        // Payment refunded
        await handlePaymentRefunded(webhookEvent);
        break;

      default:
        logger.info(
          `Unhandled PayPal webhook event type: ${webhookEvent.event_type}`
        );
    }

    // Return a 200 response to acknowledge receipt of the webhook
    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error handling PayPal webhook: ${error.message}`, error);
    // Still return 200 to PayPal to prevent retries
    return res.status(200).json({ received: true, error: error.message });
  }
};

// Helper function to handle successful payment capture
async function handlePaymentCaptureCompleted(webhookEvent) {
  try {
    const resourceId = webhookEvent.resource.id; // The PayPal capture ID
    const paypalOrderId =
      webhookEvent.resource.supplementary_data.related_ids.order_id;

    logger.info(
      `Processing completed payment for PayPal order: ${paypalOrderId}, capture: ${resourceId}`
    );

    // Find our payment record
    const payment = await Payment.findOne({ paypalOrderId: paypalOrderId });

    if (!payment) {
      logger.error(
        `Payment record not found for PayPal order ID: ${paypalOrderId}`
      );
      return;
    }

    // If payment is already completed, don't process again
    if (payment.status === "COMPLETED") {
      logger.info(`Payment ${payment._id} already marked as completed`);
      return;
    }

    // Update the payment status
    payment.status = "COMPLETED";
    payment.paypalPaymentId = resourceId;
    payment.metadata = {
      ...payment.metadata,
      captureId: resourceId,
      webhookEvent: webhookEvent.event_type,
      processedAt: new Date().toISOString(),
    };

    await payment.save();
    logger.info(
      `Updated payment ${payment._id} to COMPLETED status via webhook`
    );

    // Update the order status
    try {
      await axios.patch(
        `${
          process.env.ORDER_SERVICE_URL || "http://localhost:5001"
        }/api/orders/${payment.orderId}/status`,
        { status: "CONFIRMED" },
        { headers: { "Content-Type": "application/json" } }
      );
      logger.info(
        `Updated order ${payment.orderId} status to CONFIRMED via webhook`
      );
    } catch (orderError) {
      logger.error(
        `Failed to update order status via webhook: ${orderError.message}`
      );
    }
  } catch (error) {
    logger.error(
      `Error in handlePaymentCaptureCompleted: ${error.message}`,
      error
    );
  }
}

// Helper function to handle denied payment capture
async function handlePaymentCaptureDenied(webhookEvent) {
  try {
    const resourceId = webhookEvent.resource.id;
    const paypalOrderId =
      webhookEvent.resource.supplementary_data.related_ids.order_id;

    logger.info(`Processing denied payment for PayPal order: ${paypalOrderId}`);

    // Find our payment record
    const payment = await Payment.findOne({ paypalOrderId: paypalOrderId });

    if (!payment) {
      logger.error(
        `Payment record not found for PayPal order ID: ${paypalOrderId}`
      );
      return;
    }

    // Update the payment status
    payment.status = "FAILED";
    payment.error = "Payment capture denied by PayPal";
    payment.metadata = {
      ...payment.metadata,
      webhookEvent: webhookEvent.event_type,
      deniedAt: new Date().toISOString(),
      reason: webhookEvent.resource.status_details?.reason || "Unknown reason",
    };

    await payment.save();
    logger.info(
      `Updated payment ${payment._id} to FAILED status (denied) via webhook`
    );

    // Update the order status to CANCELED
    try {
      await axios.patch(
        `${
          process.env.ORDER_SERVICE_URL || "http://localhost:5001"
        }/api/orders/${payment.orderId}/status`,
        { status: "CANCELLED" },
        { headers: { "Content-Type": "application/json" } }
      );
      logger.info(
        `Updated order ${payment.orderId} status to CANCELLED via webhook`
      );
    } catch (orderError) {
      logger.error(
        `Failed to update order status via webhook: ${orderError.message}`
      );
    }
  } catch (error) {
    logger.error(
      `Error in handlePaymentCaptureDenied: ${error.message}`,
      error
    );
  }
}

// Helper function to handle refunded payment
async function handlePaymentRefunded(webhookEvent) {
  try {
    const resourceId = webhookEvent.resource.id;
    const paypalOrderId =
      webhookEvent.resource.supplementary_data.related_ids.order_id;

    logger.info(
      `Processing refunded payment for PayPal order: ${paypalOrderId}`
    );

    // Find our payment record
    const payment = await Payment.findOne({ paypalOrderId: paypalOrderId });

    if (!payment) {
      logger.error(
        `Payment record not found for PayPal order ID: ${paypalOrderId}`
      );
      return;
    }

    // Update the payment status
    payment.status = "REFUNDED";
    payment.metadata = {
      ...payment.metadata,
      webhookEvent: webhookEvent.event_type,
      refundId: resourceId,
      refundedAt: new Date().toISOString(),
      refundAmount: webhookEvent.resource.amount.value,
    };

    await payment.save();
    logger.info(
      `Updated payment ${payment._id} to REFUNDED status via webhook`
    );

    // Update the order status
    try {
      await axios.patch(
        `${
          process.env.ORDER_SERVICE_URL || "http://localhost:5001"
        }/api/orders/${payment.orderId}/status`,
        { status: "REFUNDED" },
        { headers: { "Content-Type": "application/json" } }
      );
      logger.info(
        `Updated order ${payment.orderId} status to REFUNDED via webhook`
      );
    } catch (orderError) {
      logger.error(
        `Failed to update order status via webhook: ${orderError.message}`
      );
    }
  } catch (error) {
    logger.error(`Error in handlePaymentRefunded: ${error.message}`, error);
  }
}

// Create payment intent (for Stripe or simple payments)
exports.createPaymentIntent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, amount, userId, email } = req.body;
    logger.info(
      `Creating payment intent for order ${orderId} with amount $${amount}`
    );

    // Create a payment record
    const payment = new Payment({
      orderId,
      userId,
      amount,
      status: "PENDING",
      paymentMethod: "CARD",
      transactionId: `intent_${Date.now()}`,
      metadata: { email },
    });

    await payment.save();
    logger.info(`Created payment record with ID: ${payment._id}`);

    return res.status(200).json({
      success: true,
      paymentId: payment._id,
      clientSecret: `mock_client_secret_${Date.now()}`,
      amount: amount,
    });
  } catch (error) {
    logger.error(`Error creating payment intent: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error creating payment intent",
      error: error.message,
    });
  }
};

// Helper function to handle completed payment for COD and other methods
exports.processPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const { orderId, amount, paymentMethod = "CARD", userId } = req.body;
    logger.info(
      `Processing ${paymentMethod} payment for order ${orderId} with amount $${amount}`
    );

    // Make sure we have a valid orderId and amount
    if (!orderId || !amount) {
      logger.error("Missing required fields: orderId or amount");
      return res.status(400).json({
        success: false,
        message: "Order ID and amount are required",
      });
    }

    // Generate a unique transaction ID
    const transactionId = `payment_${paymentMethod.toLowerCase()}_${Date.now()}`;

    // Get userId from different possible sources with fallback to guest-user
    const paymentUserId =
      userId ||
      (req.userData && req.userData.userId) ||
      (req.user && req.user.id) ||
      "guest-user";

    // Create payment record
    const payment = new Payment({
      orderId,
      userId: paymentUserId,
      amount,
      status: paymentMethod === "COD" ? "PENDING" : "COMPLETED",
      paymentMethod,
      transactionId,
      metadata: {
        processedAt: new Date().toISOString(),
        source: "direct-payment-api",
      },
    });

    await payment.save();
    logger.info(`Created payment record with ID: ${payment._id}`);

    // Update order status in order service
    try {
      const orderStatus = paymentMethod === "COD" ? "PENDING" : "CONFIRMED";
      await axios.patch(
        `${
          process.env.ORDER_SERVICE_URL || "http://localhost:5001"
        }/api/orders/${orderId}/status`,
        { status: orderStatus },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization,
          },
        }
      );
      logger.info(`Updated order ${orderId} status to ${orderStatus}`);
    } catch (orderError) {
      logger.error(`Error updating order status: ${orderError.message}`);
      // Even if order update fails, we still want to return success
      // as the payment was processed correctly
    }

    return res.status(200).json({
      success: true,
      paymentId: payment._id,
      orderId,
      transactionId,
      status: payment.status,
    });
  } catch (error) {
    logger.error(`Error processing payment: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error processing payment",
      error: error.message,
    });
  }
};

// Handle webhook (for other payment processors)
exports.handleWebhook = async (req, res) => {
  try {
    const webhookBody = req.body.toString("utf8");
    logger.info("Received payment webhook event");

    // In a real implementation, we would verify the webhook signature
    // and process different event types

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error handling webhook: ${error.message}`);
    // Return 200 to prevent retries
    return res.status(200).json({ received: true, error: error.message });
  }
};

// Get all payments (admin only)
exports.getAllPayments = async (req, res) => {
  try {
    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filtering support
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.method) filter.paymentMethod = req.query.method;
    if (req.query.orderId) filter.orderId = req.query.orderId;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Payment.countDocuments(filter);

    return res.json({
      success: true,
      count: payments.length,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      payments,
    });
  } catch (error) {
    logger.error(`Error getting all payments: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error retrieving payments",
      error: error.message,
    });
  }
};

// Get PayPal payment details
exports.getPayPalPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Find payment in database
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // If it's not a PayPal payment, return basic details
    if (payment.paymentMethod !== "PAYPAL") {
      return res.json({
        success: true,
        message: "Not a PayPal payment",
        payment: payment,
      });
    }

    // If there's no PayPal order ID, return basic details
    if (!payment.paypalOrderId) {
      return res.json({
        success: true,
        message: "PayPal order ID not found",
        payment: payment,
      });
    }

    // Get detailed information from PayPal
    try {
      const request = paypalUtils.client.ordersGet(payment.paypalOrderId);
      const response = await request;

      return res.json({
        success: true,
        payment: payment,
        paypalDetails: response.result,
      });
    } catch (paypalError) {
      logger.error(
        `Error getting PayPal payment details: ${paypalError.message}`
      );
      return res.json({
        success: true,
        message: "Could not retrieve detailed PayPal information",
        payment: payment,
        error: paypalError.message,
      });
    }
  } catch (error) {
    logger.error(`Error getting payment details: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error retrieving payment details",
      error: error.message,
    });
  }
};

// Check PayPal transaction status - admin function
exports.checkPayPalTransaction = async (req, res) => {
  try {
    const { paypalOrderId } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({
        success: false,
        message: "PayPal order ID is required",
      });
    }

    logger.info(`Admin checking PayPal transaction: ${paypalOrderId}`);

    // Get PayPal client
    const request = paypalUtils.client.ordersGet(paypalOrderId);

    // Execute the request to get order details
    const response = await request;
    logger.info(`PayPal order details retrieved for: ${paypalOrderId}`);

    // Check if payment exists in our database
    const payment = await Payment.findOne({ paypalOrderId });

    // Return the response with PayPal details and our payment record
    return res.json({
      success: true,
      paypalOrderId,
      paypalOrder: response.result,
      payment: payment || null,
    });
  } catch (error) {
    logger.error(`Error checking PayPal transaction: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error checking PayPal transaction",
      error: error.message,
    });
  }
};

// Process card payment through PayPal
exports.processCardPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array(), success: false });
    }

    const { orderId, amount, userId, cardDetails, email } = req.body;

    logger.info(
      `Processing card payment via PayPal for order: ${orderId}, amount: $${amount}`
    );

    // Create payment record in database
    const payment = new Payment({
      orderId,
      userId: userId || "guest-user",
      amount,
      status: "PENDING",
      paymentMethod: "CARD",
      transactionId: `card_paypal_${Date.now()}`,
      metadata: {
        email,
        createdAt: new Date().toISOString(),
        paymentProcessor: "PAYPAL",
        cardType: cardDetails.type || "UNKNOWN",
      },
    });

    await payment.save();
    logger.info(`Created card payment record with ID: ${payment._id}`);

    // For development/testing, allow mock processing
    if (
      process.env.MOCK_CARD_PAYMENTS === "true" &&
      process.env.NODE_ENV === "development"
    ) {
      logger.info(`Using mock card processing for order ${orderId}`);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update payment record for mock processing
      payment.status = "COMPLETED";
      payment.metadata = {
        ...payment.metadata,
        cardTransactionId: `mock_card_${Date.now()}`,
        paypalStatus: "COMPLETED",
        processedAt: new Date().toISOString(),
        isMock: true,
      };
      await payment.save();

      // Notify order service
      try {
        await axios.patch(
          `${
            process.env.ORDER_SERVICE_URL || "http://localhost:5001"
          }/api/orders/${payment.orderId}/status`,
          { status: "CONFIRMED" },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization,
            },
          }
        );
        logger.info(
          `Order ${payment.orderId} status updated to CONFIRMED (mock card payment)`
        );
      } catch (orderError) {
        logger.error(
          `Error updating order status (mock card payment): ${orderError.message}`
        );
      }

      return res.json({
        success: true,
        message: "Card payment successfully processed",
        paymentId: payment._id,
        orderId: payment.orderId,
        status: "COMPLETED",
      });
    }

    // In production, use PayPal's card processing API
    // This would typically call their API to process the card payment
    try {
      // Call PayPal card processing API (simplified representation)
      const cardPaymentResult = await paypalUtils.client.processCardPayment({
        amount: {
          currency_code: "USD",
          value: amount.toString(),
        },
        card: cardDetails,
        order_id: orderId,
      });

      // If successful, update payment record
      payment.status = "COMPLETED";
      payment.metadata = {
        ...payment.metadata,
        cardTransactionId: cardPaymentResult.id || `paypal_card_${Date.now()}`,
        paypalStatus: "COMPLETED",
        processedAt: new Date().toISOString(),
      };
      await payment.save();
      logger.info(`Card payment completed for payment ID: ${payment._id}`);

      // Update order status
      try {
        await axios.patch(
          `${
            process.env.ORDER_SERVICE_URL || "http://localhost:5001"
          }/api/orders/${payment.orderId}/status`,
          { status: "CONFIRMED" },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: req.headers.authorization,
            },
          }
        );
        logger.info(
          `Order ${payment.orderId} status updated to CONFIRMED (card payment)`
        );
      } catch (orderError) {
        logger.error(`Error updating order status: ${orderError.message}`);
      }

      return res.json({
        success: true,
        message: "Card payment successfully processed",
        paymentId: payment._id,
        orderId: payment.orderId,
        status: "COMPLETED",
      });
    } catch (error) {
      // If card processing fails, update payment status
      payment.status = "FAILED";
      payment.error = error.message;
      payment.metadata = {
        ...payment.metadata,
        failedAt: new Date().toISOString(),
        errorDetails: error.toString(),
      };
      await payment.save();
      logger.error(`Card payment failed: ${error.message}`);

      return res.status(400).json({
        success: false,
        message: "Card payment failed",
        error: error.message,
      });
    }
  } catch (error) {
    logger.error(`Error in processCardPayment: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Error processing card payment",
      error: error.message,
    });
  }
};
