const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create new order
router.post(
  "/",
  [
    body("userId").notEmpty(),
    body("restaurantId").notEmpty(),
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
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ]),
  ],
  orderController.updateOrderStatus
);

// Get orders by user
router.get("/user/:userId", orderController.getUserOrders);

// Get orders by restaurant
router.get("/restaurant/:restaurantId", orderController.getRestaurantOrders);

// Get orders by driver
router.get("/driver/:driverId", orderController.getDriverOrders);

// Assign driver to order
router.post(
  "/:id/assign-driver",
  [body("driverId").notEmpty()],
  orderController.assignDriver
);

module.exports = router;
