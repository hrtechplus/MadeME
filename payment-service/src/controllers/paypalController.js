const { client } = require("../utils/paypal");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
const axios = require("axios");
const Payment = require("../models/Payment");

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = "USD", orderId } = req.body;

    // First verify the order exists in our system
    const orderResponse = await axios.get(
      `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.authorization,
        },
      }
    );

    if (!orderResponse.data) {
      throw new Error("Order not found");
    }

    // Create PayPal payment intent
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      },
    });

    const order = await client().execute(request);

    // Create a pending payment record
    const payment = new Payment({
      orderId,
      userId: req.body.userId || "guest-user",
      amount: parseFloat(amount),
      status: "PENDING",
      paymentMethod: "PAYPAL",
      transactionId: order.result.id,
      metadata: {
        paypalOrderId: order.result.id,
        createdAt: new Date().toISOString(),
      },
    });

    await payment.save();

    res.json({
      orderId: order.result.id,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    // Capture the PayPal payment
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client().execute(request);

    if (capture.result.status === "COMPLETED") {
      // Update payment status to completed
      const payment = await Payment.findByIdAndUpdate(
        paymentId,
        {
          status: "COMPLETED",
          metadata: {
            ...capture.result,
            processedAt: new Date().toISOString(),
          },
        },
        { new: true }
      );

      if (!payment) {
        throw new Error("Payment record not found");
      }

      // Update order status to confirmed
      await axios.patch(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${payment.orderId}/status`,
        { status: "CONFIRMED" },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.authorization,
          },
        }
      );

      res.json({
        success: true,
        message: "Payment successful",
        orderId: payment.orderId,
      });
    } else {
      // Update payment status to failed
      await Payment.findByIdAndUpdate(paymentId, {
        status: "FAILED",
        metadata: {
          ...capture.result,
          processedAt: new Date().toISOString(),
        },
      });

      res.status(400).json({
        success: false,
        message: "Payment failed",
      });
    }
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    res.status(500).json({ error: "Failed to capture PayPal order" });
  }
};
