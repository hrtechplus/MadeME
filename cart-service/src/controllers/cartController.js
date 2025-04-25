const Cart = require("../models/Cart");
const { validationResult } = require("express-validator");

// Get cart for a user
exports.getCart = async (req, res) => {
  try {
    // Use the userId from the token if available, otherwise use the param
    const userId = req.userId || req.params.userId;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(200).json({ items: [], total: 0 });
    }
    res.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res
      .status(500)
      .json({ message: "Error fetching cart", error: error.message });
  }
};

// Add or update item in cart
exports.addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Use the userId from the token if available, otherwise use the body
    const userId = req.userId || req.body.userId;
    const { itemId, name, price, quantity, restaurantId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let cart = await Cart.findOne({ userId });

    // Check restaurant consistency if cart exists
    if (cart && cart.items.length > 0) {
      const existingRestaurantId = cart.items[0].restaurantId;

      // If adding item from a different restaurant, return error
      if (existingRestaurantId !== restaurantId) {
        return res.status(400).json({
          message:
            "Cannot add items from different restaurants to the same cart. Please clear your cart first.",
        });
      }
    }

    if (!cart) {
      // Create new cart if it doesn't exist
      cart = new Cart({
        userId,
        items: [{ itemId, name, price, quantity, restaurantId }],
      });
    } else {
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.itemId === itemId
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item if it doesn't exist
        cart.items.push({ itemId, name, price, quantity, restaurantId });
      }
    }

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error updating cart:", error);
    res
      .status(500)
      .json({ message: "Error updating cart", error: error.message });
  }
};

// Update item quantity
exports.updateItemQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;

    // Use the userId from the token if available, otherwise use the param
    const userId = req.userId || req.params.userId;
    const { itemId } = req.params;

    if (!userId || !itemId) {
      return res
        .status(400)
        .json({ message: "User ID and Item ID are required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item.itemId === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error("Error updating item quantity:", error);
    res
      .status(500)
      .json({ message: "Error updating item quantity", error: error.message });
  }
};

// Remove item from cart
exports.removeItem = async (req, res) => {
  try {
    // Use the userId from the token if available, otherwise use the param
    const userId = req.userId || req.params.userId;
    const { itemId } = req.params;

    if (!userId || !itemId) {
      return res
        .status(400)
        .json({ message: "User ID and Item ID are required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item.itemId !== itemId);
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error("Error removing item:", error);
    res
      .status(500)
      .json({ message: "Error removing item", error: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    // Use the userId from the token if available, otherwise use the param
    const userId = req.userId || req.params.userId;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Use findOneAndDelete with better error handling
    const result = await Cart.findOneAndDelete({ userId });

    // If no cart was found, still return success (idempotent operation)
    if (!result) {
      console.log(
        `No cart found for user ${userId}, but returning success anyway`
      );
    }

    return res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error in clearCart:", error);
    return res.status(500).json({
      message: "Error clearing cart",
      error: error.message || "Unknown database error",
    });
  }
};
