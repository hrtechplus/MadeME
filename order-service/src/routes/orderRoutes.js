const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const orderController = require("../controllers/orderController");

// Admin routes
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// === ADMIN ROUTES ===

// Get all orders (admin only)
router.get(
  "/admin/all",
  verifyToken,
  verifyAdmin,
  orderController.getAllOrders
);

// Create order by admin (admin only)
router.post(
  "/admin/create",
  verifyToken,
  verifyAdmin,
  [
    body("userId").notEmpty(),
    body("restaurantId").notEmpty(),
    body("items").isArray(),
    body("total").isNumeric(),
    body("deliveryAddress").isObject(),
    body("deliveryAddress.street").notEmpty(),
    body("deliveryAddress.city").notEmpty(),
    body("deliveryAddress.state").notEmpty(),
    body("deliveryAddress.zipCode").notEmpty(),
    body("status")
      .optional()
      .isIn([
        "VERIFYING",
        "PENDING",
        "CONFIRMED",
        "REJECTED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ]),
  ],
  orderController.createOrderByAdmin
);

// Bulk update orders (admin only)
router.patch(
  "/admin/bulk-update",
  verifyToken,
  verifyAdmin,
  [body("orderIds").isArray(), body("updates").isObject()],
  orderController.bulkUpdateOrders
);

// Bulk delete orders (admin only)
router.delete(
  "/admin/bulk-delete",
  verifyToken,
  verifyAdmin,
  [body("orderIds").isArray()],
  orderController.bulkDeleteOrders
);

// Advanced search orders (admin only)
router.get(
  "/admin/search",
  verifyToken,
  verifyAdmin,
  orderController.searchOrders
);

// Order statistics (admin only)
router.get(
  "/admin/statistics",
  verifyToken,
  verifyAdmin,
  orderController.getOrderStats
);

// === USER ROUTES ===

// Get orders by user
router.get("/user/:userId", orderController.getUserOrders);

// Get orders by restaurant
router.get("/restaurant/:restaurantId", orderController.getRestaurantOrders);

// Get orders by driver
router.get("/driver/:driverId", orderController.getDriverOrders);

// Get order by ID
router.get("/:id", orderController.getOrderById);

// Create new order
router.post(
  "/",
  [
    body("userId").notEmpty(),
    body("restaurantId").notEmpty(),
    body("items").isArray(),
    body("total").isNumeric(),
    body("deliveryAddress").isObject(),
    body("deliveryAddress.street").notEmpty(),
    body("deliveryAddress.city").notEmpty(),
    body("deliveryAddress.state").notEmpty(),
    body("deliveryAddress.zipCode").notEmpty(),
  ],
  orderController.createOrder
);

// Modify order before confirmation
router.patch(
  "/:id/modify",
  verifyToken,
  [
    body("items").optional().isArray(),
    body("deliveryAddress").optional().isObject(),
    body("deliveryAddress.street").optional().notEmpty(),
    body("deliveryAddress.city").optional().notEmpty(),
    body("deliveryAddress.state").optional().notEmpty(),
    body("deliveryAddress.zipCode").optional().notEmpty(),
  ],
  orderController.modifyOrder
);

// Update order (admin only)
router.put("/:id", verifyToken, verifyAdmin, orderController.updateOrder);

// Update order status
router.patch(
  "/:id/status",
  verifyToken,
  verifyAdmin,
  [
    body("status").isIn([
      "VERIFYING",
      "PENDING",
      "CONFIRMED",
      "REJECTED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ]),
  ],
  orderController.updateOrderStatus
);

// Add route for location updates from delivery service
router.post(
  "/:id/location",
  [
    body("latitude").isNumeric().notEmpty(),
    body("longitude").isNumeric().notEmpty(),
    body("driverId").notEmpty(),
  ],
  orderController.updateDriverLocation
);

// Assign driver to order
router.post(
  "/:id/assign-driver",
  verifyToken,
  verifyAdmin,
  [
    body("driverId").notEmpty(),
    body("driverName").notEmpty(),
    body("driverPhone").notEmpty(),
    body("estimatedDeliveryTime").optional().isISO8601(),
    body("deliveryNotes").optional().isString(),
  ],
  orderController.assignDriver
);

// Track order status
router.get("/:id/track", orderController.trackOrder);

// Cancel order
router.post(
  "/:id/cancel",
  verifyToken,
  [body("cancellationReason").optional().isString()],
  orderController.cancelOrder
);

// Delete order (admin only)
router.delete("/:id", verifyToken, verifyAdmin, orderController.deleteOrder);

// Handle restaurant response
router.post(
  "/:id/restaurant-response",
  [
    body("response").isIn(["ACCEPTED", "REJECTED"]),
    body("reason").optional().isString(),
  ],
  orderController.handleRestaurantResponse
);

// Alternative order cancellation route (simpler authentication)
router.post(
  "/:id/user-cancel",
  [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("cancellationReason").optional().isString(),
  ],
  orderController.userCancelOrder
);

module.exports = router;
