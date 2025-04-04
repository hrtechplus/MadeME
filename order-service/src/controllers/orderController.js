const Order = require("../models/Order");
const { axiosWithRetry } = require("../utils/retry");
const { validationResult } = require("express-validator");

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, restaurantId, deliveryAddress } = req.body;

    // Fetch cart from cart service with retry
    const cart = await axiosWithRetry({
      method: "get",
      url: `${process.env.CART_SERVICE_URL}/api/cart/${userId}`,
    });

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Create new order
    const order = new Order({
      userId,
      restaurantId,
      items: cart.items,
      total: cart.total,
      deliveryAddress,
      status: "PENDING",
    });

    await order.save();

    // Clear cart after order creation with retry
    await axiosWithRetry({
      method: "delete",
      url: `${process.env.CART_SERVICE_URL}/api/cart/${userId}`,
    });

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
