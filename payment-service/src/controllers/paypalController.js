const { client } = require("../utils/paypal");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = "USD" } = req.body;

    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
        },
      ],
    });

    const order = await client().execute(request);
    res.json({ orderId: order.result.id });
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
};

exports.captureOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client().execute(request);

    if (capture.result.status === "COMPLETED") {
      // Here you would typically create an order in your database
      res.json({
        success: true,
        message: "Payment successful",
        orderId: capture.result.id,
      });
    } else {
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
