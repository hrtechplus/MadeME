const Order = require("../models/Order");
const { validationResult } = require("express-validator");
const axios = require("axios");

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, restaurantId, items, deliveryAddress, total } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order items cannot be empty" });
    }

    // Create new order
    const order = new Order({
      userId,
      restaurantId,
      items,
      total,
      deliveryAddress,
      status: "PENDING",
      restaurantResponse: "PENDING",
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      message: "Error creating order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

// Handle restaurant response
exports.handleRestaurantResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, reason } = req.body;

    if (!["ACCEPTED", "REJECTED"].includes(response)) {
      return res.status(400).json({ message: "Invalid response" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.restaurantResponse = response;
    if (response === "REJECTED") {
      order.status = "REJECTED";
      order.rejectionReason = reason;
    } else {
      order.status = "CONFIRMED";
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: "Error processing restaurant response",
      error: error.message,
    });
  }
};

// Get orders by user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user orders", error: error.message });
  }
};

// Get orders by restaurant
exports.getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching restaurant orders",
      error: error.message,
    });
  }
};

// Get orders by driver
exports.getDriverOrders = async (req, res) => {
  try {
    const { driverId } = req.params;
    const orders = await Order.find({ driverId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching driver orders", error: error.message });
  }
};

// Assign driver to order
exports.assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.driverId = driverId;
    order.status = "OUT_FOR_DELIVERY";
    await order.save();

    res.json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error assigning driver", error: error.message });
  }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    // Build query based on filters
    let query = {};

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "name email"); // Assuming there's a user model with these fields

    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching all orders", error: error.message });
  }
};

// Cancel an order
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the user is authorized to cancel this order
    // Either the user ID must match or the user must be an admin
    const isAuthorized = order.userId === req.userId || req.role === "admin";
    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this order" });
    }

    // Only allow cancellation if order is in VERIFYING or PREPARING status
    if (order.status !== "VERIFYING" && order.status !== "PREPARING") {
      return res.status(400).json({
        message: "Order cannot be cancelled",
        details:
          "Orders can only be cancelled while in verifying or preparing status",
      });
    }

    // Update the order status to CANCELLED
    order.status = "CANCELLED";
    order.updatedAt = Date.now();

    // Add cancellation reason if provided
    if (req.body.cancellationReason) {
      order.rejectionReason = req.body.cancellationReason;
    }

    await order.save();

    // If there's a payment associated with the order, we should refund it or mark it for refund
    if (order.paymentId) {
      try {
        // Notify payment service about the cancellation
        // This is where you would integrate with your payment service
        // to handle refunds or cancel pending payments
        const paymentServiceUrl =
          process.env.PAYMENT_SERVICE_URL || "http://payment-service:5003";
        await axios.post(`${paymentServiceUrl}/api/payment/cancel`, {
          orderId: id,
          paymentId: order.paymentId,
        });
      } catch (error) {
        console.error(
          "Failed to notify payment service of cancellation:",
          error
        );
        // Continue with order cancellation even if payment service notification fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Order has been cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res
      .status(500)
      .json({ message: "Error cancelling order", error: error.message });
  }
};
