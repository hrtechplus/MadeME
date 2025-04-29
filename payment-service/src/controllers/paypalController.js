const { client } = require("../utils/paypal");
const Payment = require("../models/Payment");
const axios = require("axios");
const logger = require("../utils/logger");

exports.createOrder = async (req, res) => {
  try {
    const {
      amount,
      currency = "USD",
      orderId,
      userId = "guest-user",
    } = req.body;

    logger.info(
      `Creating PayPal order for order ${orderId} with amount ${amount} ${currency}`
    );

    // Create a pending payment record first
    const payment = new Payment({
      orderId,
      userId,
      amount: parseFloat(amount),
      status: "PENDING",
      paymentMethod: "PAYPAL",
      transactionId: `paypal_init_${Date.now()}`,
      metadata: {
        createdAt: new Date().toISOString(),
        platform: req.body.platform || "web",
      },
    });

    await payment.save();
    logger.info(`Created payment record with ID: ${payment._id}`);

    // Set up the PayPal order request body
    const requestBody = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          description: `Order #${orderId} for MadeME Food Delivery`,
          amount: {
            currency_code: currency,
            value: amount.toString(),
            breakdown: {
              item_total: {
                currency_code: currency,
                value: amount.toString(),
              },
            },
          },
          items: [
            {
              name: "Food Order",
              description: `Order #${orderId}`,
              unit_amount: {
                currency_code: currency,
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
    };

    // Use our improved client.ordersCreate method
    logger.info("Sending request to PayPal to create order");
    const response = await client.ordersCreate(requestBody);
    logger.info(
      `PayPal order created successfully with ID: ${response.result.id}`
    );

    // Find the approval URL in the links array
    const approvalUrl = response.result.links.find(
      (link) => link.rel === "approve"
    ).href;
    logger.info(`PayPal approval URL: ${approvalUrl}`);

    // Update payment record with PayPal order ID
    payment.paypalOrderId = response.result.id;
    await payment.save();
    logger.info(
      `Updated payment record with PayPal order ID: ${response.result.id}`
    );

    // Return the response with all necessary data
    return res.json({
      success: true,
      paymentId: payment._id,
      paypalOrderId: response.result.id,
      approvalUrl,
      orderId,
    });
  } catch (error) {
    logger.error(`Error creating PayPal order: ${error.message}`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to create PayPal order",
      error: error.message,
    });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    logger.info(`Capturing PayPal order ${orderId} for payment ${paymentId}`);

    // Check if payment record exists
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      logger.error(`Payment record ${paymentId} not found`);
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Check if payment is already completed
    if (payment.status === "COMPLETED") {
      logger.info(`Payment ${paymentId} already completed, returning success`);
      return res.json({
        success: true,
        message: "Payment already processed",
        orderId: payment.orderId,
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

    // Use our improved client.ordersCapture method
    logger.info(`Sending capture request to PayPal for order ${orderId}`);
    const capture = await client.ordersCapture(orderId);
    logger.info(
      `Successfully captured PayPal order ${orderId}, status: ${capture.result.status}`
    );

    if (capture.result.status === "COMPLETED") {
      // Get the capture ID from the response
      const captureId =
        capture.result.purchase_units[0].payments.captures[0].id;

      // Update payment status to COMPLETED
      payment.status = "COMPLETED";
      payment.paypalPaymentId = captureId;
      payment.metadata = {
        ...payment.metadata,
        captureId,
        paypalStatus: capture.result.status,
        capturedAt: new Date().toISOString(),
      };
      await payment.save();
      logger.info(`Updated payment ${payment._id} status to COMPLETED`);

      // Update order status to confirmed
      try {
        logger.info(`Updating order ${payment.orderId} status to CONFIRMED`);
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
        logger.info(`Successfully updated order ${payment.orderId} status`);
      } catch (orderError) {
        logger.error(`Error updating order status: ${orderError.message}`);
        // Continue with success response even if order update fails
      }

      return res.json({
        success: true,
        message: "Payment successful",
        orderId: payment.orderId,
        captureId,
      });
    } else {
      // Update payment status to FAILED
      logger.warn(
        `PayPal capture for order ${orderId} did not complete: ${capture.result.status}`
      );
      payment.status = "FAILED";
      payment.metadata = {
        ...payment.metadata,
        captureResult: capture.result,
        processedAt: new Date().toISOString(),
      };
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment failed",
        status: capture.result.status,
      });
    }
  } catch (error) {
    logger.error(`Error capturing PayPal order: ${error.message}`, error);

    // Try to update payment status to failed if we have a paymentId
    if (req.body.paymentId) {
      try {
        await Payment.findByIdAndUpdate(req.body.paymentId, {
          status: "FAILED",
          error: error.message,
          metadata: {
            failedAt: new Date().toISOString(),
            errorDetails: error.toString(),
          },
        });
      } catch (dbError) {
        logger.error(`Error updating payment status: ${dbError.message}`);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to capture PayPal order",
      error: error.message,
    });
  }
};
