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

    // Validate status
    const validStatuses = [
      "VERIFYING",
      "PENDING",
      "CONFIRMED",
      "REJECTED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization - allow users to update their own orders
    // User can only update order if:
    // 1. They are the user who placed the order AND
    // 2. The order is in PREPARING state
    const isUserOrder = req.userId && req.userId === order.userId;
    const isAdmin = req.role === "admin";

    if (!isAdmin && (!isUserOrder || order.status !== "PREPARING")) {
      return res.status(403).json({
        message:
          "Not authorized to update this order or order is not in a state that can be updated by users",
      });
    }

    // Admin can update to any status, but users have limited options
    if (!isAdmin && isUserOrder) {
      // Users can only set specific statuses
      const allowedUserStatuses = [
        "CONFIRMED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ];
      if (!allowedUserStatuses.includes(status)) {
        return res.status(400).json({
          message: "You are not authorized to set this status",
        });
      }
    }

    // Update the status
    order.status = status;

    // If order is cancelled, record the timestamp
    if (status === "CANCELLED") {
      order.updatedAt = Date.now();
    }

    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      message: "Error updating order status",
      error: error.message,
    });
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

// Complete the cancel order functionality
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
        console.log(
          `Order ${id} cancelled, payment ${order.paymentId} should be refunded`
        );
      } catch (error) {
        console.error("Error processing refund:", error);
        // Continue with cancellation even if refund processing fails
      }
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      message: "Error cancelling order",
      error: error.message,
    });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Error fetching order",
      error: error.message,
    });
  }
};

// Delete order (admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is admin in middleware verifyAdmin

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await Order.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      message: "Error deleting order",
      error: error.message,
    });
  }
};

// Update order details (admin only)
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify user is admin in middleware verifyAdmin

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Prevent changing certain fields directly
    delete updates._id;
    delete updates.createdAt;

    // Update the order with the new data
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      message: "Error updating order",
      error: error.message,
    });
  }
};
