const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const orderController = require("../controllers/orderController");

// Admin routes
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// Get all orders (admin only)
router.get(
  "/admin/all",
  verifyToken,
  verifyAdmin,
  orderController.getAllOrders
);

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

// Update order status
router.patch(
  "/:id/status",
  [
    body("status").isIn([
      "PENDING",
      "CONFIRMED",
      "REJECTED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ]),
  ],
  orderController.updateOrderStatus
);

// Handle restaurant response
router.post(
  "/:id/restaurant-response",
  [
    body("response").isIn(["ACCEPTED", "REJECTED"]),
    body("reason").optional().isString(),
  ],
  orderController.handleRestaurantResponse
);

// Get orders by user
router.get("/user/:userId", orderController.getUserOrders);

// Get orders by restaurant
router.get("/restaurant/:restaurantId", orderController.getRestaurantOrders);

module.exports = router;
