const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get cart
router.get("/:userId", cartController.getCart);

// Add to cart
router.post(
  "/add",
  [
    body("userId").notEmpty(),
    body("itemId").notEmpty(),
    body("name").notEmpty(),
    body("price").isFloat({ min: 0 }),
    body("quantity").isInt({ min: 1 }),
    body("restaurantId").notEmpty(),
  ],
  cartController.addToCart
);

// Update item quantity
router.put(
  "/:userId/:itemId",
  [body("quantity").isInt({ min: 1 })],
  cartController.updateItemQuantity
);

// Remove item
router.delete("/:userId/:itemId", cartController.removeItem);

// Clear cart
router.delete("/:userId", cartController.clearCart);

module.exports = router;
