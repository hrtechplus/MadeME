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

    // Admin check - this route is already protected by the verifyAdmin middleware
    // So if we get here, user is already an admin and we can skip permission checks

    // Update the status
    order.status = status;

    // Track who made the change
    order.lastModifiedBy = req.userData ? req.userData.userId : "system";

    // If order is cancelled, record the timestamp
    if (status === "CANCELLED") {
      order.updatedAt = Date.now();
    }

    await order.save();

    // Notify tracking users about status change via notification service
    try {
      // Generate an appropriate message based on status
      const statusMessages = {
        CONFIRMED: "Your order has been confirmed and is being processed.",
        PREPARING: "Your order is now being prepared.",
        OUT_FOR_DELIVERY: "Your order is out for delivery.",
        DELIVERED: "Your order has been delivered. Enjoy!",
        CANCELLED: "Your order has been cancelled.",
        REJECTED: "Your order has been rejected.",
      };

      const message =
        statusMessages[status] ||
        `Your order status has been updated to ${status}.`;

      // Send update to notification service
      await axios.post(
        `${
          process.env.NOTIFICATION_SERVICE_URL || "http://localhost:8015"
        }/notification/ctrl/api/v1/order-update/${id}`,
        {
          status: status,
          userId: order.userId,
          message: message,
          timestamp: new Date(),
          driverInfo:
            status === "OUT_FOR_DELIVERY"
              ? {
                  driverId: order.delivery?.driverId,
                  driverName: order.delivery?.driverName,
                  driverPhone: order.delivery?.driverPhone,
                }
              : null,
          estimatedDeliveryTime: order.delivery?.estimatedDeliveryTime,
        }
      );

      // Also create a direct notification for the user
      await axios.post(
        `${
          process.env.NOTIFICATION_SERVICE_URL || "http://localhost:8015"
        }/notification/ctrl/api/v1/create`,
        {
          userId: order.userId,
          message: message,
          type: "ORDER_STATUS",
          orderId: id,
          status: false,
        }
      );
    } catch (notificationError) {
      console.error("Failed to send status notification:", notificationError);
      // Continue with the process even if notification fails
    }

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
    const {
      driverId,
      driverName,
      driverPhone,
      estimatedDeliveryTime,
      deliveryNotes,
    } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order with driver information and estimated delivery time
    order.delivery = {
      driverId,
      driverName,
      driverPhone,
      assignedAt: new Date(),
      estimatedDeliveryTime:
        estimatedDeliveryTime || new Date(Date.now() + 30 * 60000), // Default 30 min if not specified
      deliveryNotes: deliveryNotes || "",
    };

    order.status = "OUT_FOR_DELIVERY";

    // Track who made the change
    order.lastModifiedBy = req.userData ? req.userData.userId : "system";

    await order.save();

    // Notify the delivery service about the assignment
    try {
      await axios.post(
        `${
          process.env.DELIVERY_SERVICE_URL || "http://localhost:8016"
        }/deliverydriver/api/v1/assignments`,
        {
          orderId: id,
          driverId: driverId,
          orderDetails: {
            customerName: order.userId, // Ideally, fetch the actual name from user service
            deliveryAddress: order.deliveryAddress,
            restaurantId: order.restaurantId,
            items: order.items.length,
            specialInstructions: order.specialInstructions,
          },
        }
      );
    } catch (notificationError) {
      console.error("Failed to notify delivery service:", notificationError);
      // Continue with the process even if notification fails
    }

    // Send notification to the user
    try {
      await axios.post(
        `${
          process.env.NOTIFICATION_SERVICE_URL || "http://localhost:8015"
        }/notification/ctrl/api/v1/create`,
        {
          userId: order.userId,
          message: `Your order #${
            order._id
          } has been assigned to driver ${driverName}. Estimated delivery time: ${new Date(
            order.delivery.estimatedDeliveryTime
          ).toLocaleTimeString()}`,
          type: "DRIVER_ASSIGNED",
          orderId: order._id,
          driverDetails: {
            name: driverName,
            phone: driverPhone,
          },
        }
      );
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError);
      // Continue with the process even if notification fails
    }

    res.json(order);
  } catch (error) {
    console.error("Error assigning driver:", error);
    res.status(500).json({
      message: "Error assigning driver",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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

    // Debug output to see what's in the request
    console.log("Cancel order request userData:", req.userData);
    console.log("Order userId:", order.userId);

    // In dev mode, if authentication is bypassed but we still have userId in body or query
    let userId = req.userData?.userId;
    if (!userId && process.env.NODE_ENV === "development") {
      userId = req.body.userId || req.query.userId || "guest-user";
      console.log("Using fallback userId in development:", userId);
    }

    // Check if the user is authorized to cancel this order
    const isUserOrder = userId && userId === order.userId;
    const isAdmin = req.userData && req.userData.role === "admin";

    console.log("isUserOrder:", isUserOrder);
    console.log("isAdmin:", isAdmin);

    if (!isUserOrder && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this order" });
    }

    // Only allow cancellation if order is in VERIFYING, PENDING, or PREPARING status
    if (
      order.status !== "VERIFYING" &&
      order.status !== "PENDING" &&
      order.status !== "PREPARING"
    ) {
      return res.status(400).json({
        message: "Order cannot be cancelled",
        details:
          "Orders can only be cancelled while in verifying, pending, or preparing status",
      });
    }

    // Update the order status to CANCELLED
    order.status = "CANCELLED";
    order.updatedAt = Date.now();
    order.lastModifiedBy = userId || "system";

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

// Alternative order cancellation method with simpler authentication
exports.userCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, cancellationReason } = req.body;

    // Find the order
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify that the user ID in the request matches the order's user ID
    if (order.userId !== userId) {
      return res.status(403).json({
        message: "Not authorized to cancel this order",
        details: "The provided user ID does not match the order's user ID",
      });
    }

    // Check if the order is in a status that can be cancelled
    if (!["VERIFYING", "PENDING", "PREPARING"].includes(order.status)) {
      return res.status(400).json({
        message: "Order cannot be cancelled",
        details:
          "Orders can only be cancelled while in verifying, pending, or preparing status",
      });
    }

    // Update the order status to CANCELLED
    order.status = "CANCELLED";
    order.updatedAt = Date.now();
    order.lastModifiedBy = userId;

    // Add cancellation reason if provided
    if (cancellationReason) {
      order.rejectionReason = cancellationReason;
    }

    await order.save();

    // If there's a payment associated with the order, handle refund
    if (order.paymentId) {
      try {
        console.log(
          `Order ${id} cancelled, payment ${order.paymentId} should be refunded`
        );
        // In a real implementation, you would integrate with your payment service here
      } catch (error) {
        console.error("Error processing refund:", error);
      }
    }

    return res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error in userCancelOrder:", error);
    return res.status(500).json({
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

// Modify order before confirmation
exports.modifyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, deliveryAddress, specialInstructions } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order can be modified
    if (order.status !== "VERIFYING" && order.status !== "PENDING") {
      return res.status(400).json({
        message: "Order cannot be modified",
        details:
          "Orders can only be modified while in verifying or pending status",
      });
    }

    // Check authorization - only the user who placed the order can modify it
    const isUserOrder = req.userData && req.userData.userId === order.userId;

    if (!isUserOrder && req.userData.role !== "admin") {
      return res.status(403).json({
        message: "Not authorized to modify this order",
      });
    }

    // Update items if provided
    if (items && items.length > 0) {
      order.items = items;

      // Recalculate total
      order.total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    // Update delivery address if provided
    if (deliveryAddress) {
      order.deliveryAddress = {
        ...order.deliveryAddress,
        ...deliveryAddress,
      };
    }

    // Update special instructions if provided
    if (specialInstructions !== undefined) {
      order.specialInstructions = specialInstructions;
    }

    // Update timestamp
    order.updatedAt = Date.now();

    await order.save();

    res.json({
      success: true,
      message: "Order modified successfully",
      order,
    });
  } catch (error) {
    console.error("Error modifying order:", error);
    res.status(500).json({
      message: "Error modifying order",
      error: error.message,
    });
  }
};

// Track order status
exports.trackOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Prepare tracking response
    const trackingInfo = {
      orderId: order._id,
      status: order.status,
      statusHistory: order.statusHistory,
      estimatedDeliveryTime: order.delivery?.estimatedDeliveryTime,
      deliveryAddress: order.deliveryAddress,
      driver: null,
      currentLocation: null,
      restaurant: {
        id: order.restaurantId,
        // Additional restaurant details could be fetched from restaurant service
      },
    };

    // If the order is out for delivery or delivered, include driver information
    if (
      ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status) &&
      order.delivery?.driverId
    ) {
      trackingInfo.driver = {
        id: order.delivery.driverId,
        name: order.delivery.driverName,
        phone: order.delivery.driverPhone,
      };

      // Include current location if available
      if (order.delivery.currentLocation) {
        trackingInfo.currentLocation = {
          latitude: order.delivery.currentLocation.latitude,
          longitude: order.delivery.currentLocation.longitude,
          lastUpdated: order.delivery.currentLocation.timestamp,
        };
      }

      // If we don't have real-time location or it's outdated (more than 5 minutes old)
      if (
        !trackingInfo.currentLocation ||
        Date.now() -
          new Date(trackingInfo.currentLocation.lastUpdated).getTime() >
          5 * 60 * 1000
      ) {
        try {
          // Try to fetch real-time location from delivery service
          const deliveryResponse = await axios.get(
            `${
              process.env.DELIVERY_SERVICE_URL || "http://localhost:8016"
            }/deliverydriver/api/v1/ws/drivers/cdrivers`
          );

          const drivers = deliveryResponse.data;
          const driverData = drivers[order.delivery.driverId];

          if (driverData && driverData.location) {
            trackingInfo.currentLocation = {
              latitude: driverData.location.latitude,
              longitude: driverData.location.longitude,
              lastUpdated: new Date(),
            };

            // Also update the order with this location for future reference
            order.delivery.currentLocation = {
              latitude: driverData.location.latitude,
              longitude: driverData.location.longitude,
              timestamp: new Date(),
            };

            // Add to location history
            if (!order.delivery.locationHistory) {
              order.delivery.locationHistory = [];
            }

            order.delivery.locationHistory.push(order.delivery.currentLocation);
            await order.save();
          }
        } catch (error) {
          console.error("Failed to fetch real-time location:", error);
          // Continue with the available data even if real-time fetch fails
        }
      }
    }

    res.json(trackingInfo);
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(500).json({
      message: "Error tracking order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create order by admin (admin only)
exports.createOrderByAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      userId,
      restaurantId,
      items,
      deliveryAddress,
      total,
      status = "PENDING",
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order items cannot be empty" });
    }

    // Admin can create order with custom status
    const order = new Order({
      userId,
      restaurantId,
      items,
      total,
      deliveryAddress,
      status,
      restaurantResponse: status === "CONFIRMED" ? "ACCEPTED" : "PENDING",
      adminCreated: true,
      createdBy: req.userId, // Store the admin ID who created this order
    });

    await order.save();
    res.status(201).json({
      success: true,
      message: "Order created successfully by admin",
      order,
    });
  } catch (error) {
    console.error("Admin order creation error:", error);
    res.status(500).json({
      message: "Error creating order by admin",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Bulk update orders (admin only)
exports.bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, updates } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "Order IDs array is required" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Updates object is required" });
    }

    // Prevent changing certain fields directly
    delete updates._id;
    delete updates.createdAt;
    updates.updatedAt = Date.now();

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} orders updated successfully`,
      result,
    });
  } catch (error) {
    console.error("Error bulk updating orders:", error);
    res.status(500).json({
      message: "Error bulk updating orders",
      error: error.message,
    });
  }
};

// Search orders (admin only)
exports.searchOrders = async (req, res) => {
  try {
    const {
      keyword,
      status,
      startDate,
      endDate,
      minTotal,
      maxTotal,
      restaurantId,
      userId,
      page = 1,
      limit = 20,
    } = req.query;

    // Build complex query with all filters
    let query = {};

    // Keyword search (searches in order ID or address fields)
    if (keyword) {
      const regex = new RegExp(keyword, "i");
      query.$or = [
        { _id: { $regex: regex } },
        { "deliveryAddress.street": { $regex: regex } },
        { "deliveryAddress.city": { $regex: regex } },
        { "deliveryAddress.state": { $regex: regex } },
        { "deliveryAddress.zipCode": { $regex: regex } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Filter by total price range
    if (minTotal !== undefined || maxTotal !== undefined) {
      query.total = {};
      if (minTotal !== undefined) query.total.$gte = Number(minTotal);
      if (maxTotal !== undefined) query.total.$lte = Number(maxTotal);
    }

    // Filter by restaurant ID
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    // Filter by user ID
    if (userId) {
      query.userId = userId;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        total: totalOrders,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalOrders / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error searching orders:", error);
    res.status(500).json({
      message: "Error searching orders",
      error: error.message,
    });
  }
};

// Get order statistics (admin only)
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Date range filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get total orders
    const totalOrders = await Order.countDocuments(dateFilter);

    // Get counts by status
    const statusCounts = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Format status counts as an object
    const ordersByStatus = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Get revenue stats
    const revenueStats = await Order.aggregate([
      {
        $match: { ...dateFilter, status: { $nin: ["CANCELLED", "REJECTED"] } },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          avgOrderValue: { $avg: "$total" },
          minOrderValue: { $min: "$total" },
          maxOrderValue: { $max: "$total" },
        },
      },
    ]);

    // Get orders by restaurant
    const ordersByRestaurant = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Response with statistics
    res.json({
      success: true,
      statistics: {
        totalOrders,
        ordersByStatus,
        revenue:
          revenueStats.length > 0
            ? {
                totalRevenue: revenueStats[0].totalRevenue,
                avgOrderValue: revenueStats[0].avgOrderValue,
                minOrderValue: revenueStats[0].minOrderValue,
                maxOrderValue: revenueStats[0].maxOrderValue,
              }
            : {
                totalRevenue: 0,
                avgOrderValue: 0,
                minOrderValue: 0,
                maxOrderValue: 0,
              },
        topRestaurants: ordersByRestaurant,
      },
    });
  } catch (error) {
    console.error("Error getting order statistics:", error);
    res.status(500).json({
      message: "Error getting order statistics",
      error: error.message,
    });
  }
};

// Bulk delete orders (admin only)
exports.bulkDeleteOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "Order IDs array is required" });
    }

    const result = await Order.deleteMany({ _id: { $in: orderIds } });

    res.json({
      success: true,
      message: `${result.deletedCount} orders deleted successfully`,
      result,
    });
  } catch (error) {
    console.error("Error bulk deleting orders:", error);
    res.status(500).json({
      message: "Error bulk deleting orders",
      error: error.message,
    });
  }
};

// Update driver location
exports.updateDriverLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, latitude, longitude } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify this is the correct driver for this order
    if (!order.delivery || order.delivery.driverId !== driverId) {
      return res.status(403).json({
        message: "Driver is not authorized for this order",
      });
    }

    // Create a new location entry
    const newLocation = {
      latitude,
      longitude,
      timestamp: new Date(),
    };

    // Update current location
    order.delivery.currentLocation = newLocation;

    // Add to location history if it doesn't exist yet
    if (!order.delivery.locationHistory) {
      order.delivery.locationHistory = [];
    }

    order.delivery.locationHistory.push(newLocation);

    await order.save();

    // Send notification to customer about driver location update
    try {
      // Only send notifications occasionally (not for every update) to avoid spam
      // For example, send a notification every 5 minutes or at significant distance changes
      const shouldNotify = shouldSendLocationNotification(order);

      if (shouldNotify) {
        // Calculate estimated arrival time based on location
        const estimatedMinutes = calculateEstimatedArrival(
          latitude,
          longitude,
          order.deliveryAddress.coordinates
        );

        await axios.post(
          `${
            process.env.NOTIFICATION_SERVICE_URL || "http://localhost:8015"
          }/notification/ctrl/api/v1/create`,
          {
            userId: order.userId,
            message: `Your driver is ${estimatedMinutes} minutes away`,
            type: "DRIVER_LOCATION_UPDATE",
            orderId: order._id,
          }
        );
      }
    } catch (notificationError) {
      console.error("Failed to send location notification:", notificationError);
      // Continue with the process even if notification fails
    }

    res.json({
      success: true,
      message: "Driver location updated successfully",
    });
  } catch (error) {
    console.error("Error updating driver location:", error);
    res.status(500).json({
      message: "Error updating driver location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper function to determine if we should send a location notification
function shouldSendLocationNotification(order) {
  // If no previous notifications have been sent, definitely send one
  if (
    !order.delivery.locationHistory ||
    order.delivery.locationHistory.length <= 1
  ) {
    return true;
  }

  // Check if it's been at least 5 minutes since the last notification
  const lastLocation =
    order.delivery.locationHistory[order.delivery.locationHistory.length - 2];
  const timeSinceLastUpdate =
    Date.now() - new Date(lastLocation.timestamp).getTime();

  // 5 minutes = 300000 milliseconds
  return timeSinceLastUpdate > 300000;
}

// Helper function to calculate estimated arrival time
function calculateEstimatedArrival(driverLat, driverLng, destinationCoords) {
  // If destination coordinates aren't available, return a default estimate
  if (
    !destinationCoords ||
    !destinationCoords.latitude ||
    !destinationCoords.longitude
  ) {
    return 15; // Default 15 minutes
  }

  // Simple calculation based on "as the crow flies" distance
  // In a real app, you'd use a routing service like Google Maps API for accurate estimates
  const distance = calculateDistance(
    driverLat,
    driverLng,
    destinationCoords.latitude,
    destinationCoords.longitude
  );

  // Assuming average speed of 30 km/h in city traffic
  // Convert distance (in km) to minutes: (distance / speed) * 60
  const estimatedMinutes = Math.round((distance / 30) * 60);

  // Return a reasonable minimum value
  return Math.max(estimatedMinutes, 2);
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
