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

    console.log(`Adding item ${itemId} to cart for user ${userId}`);

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
      console.log(`Creating new cart for user ${userId}`);
      cart = new Cart({
        userId,
        items: [{ itemId, name, price, quantity, restaurantId }],
      });
    } else {
      // Check if item already exists in cart using only the itemId
      // This ensures we correctly identify items regardless of any prefixes
      const existingItemIndex = cart.items.findIndex(
        (item) => String(item.itemId) === String(itemId)
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        console.log(`Item ${itemId} exists in cart, updating quantity`);
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item if it doesn't exist
        console.log(`Adding new item ${itemId} to cart`);
        cart.items.push({
          itemId,
          name,
          price,
          quantity,
          restaurantId,
        });
      }
    }

    await cart.save();
    console.log(
      `Cart updated for user ${userId}, now has ${cart.items.length} items`
    );
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

    console.log(
      `Updating quantity for item ${itemId} in cart for user ${userId}`
    );

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Use string comparison to ensure we find the item regardless of type
    const itemIndex = cart.items.findIndex(
      (item) => String(item.itemId) === String(itemId)
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    console.log(`Item ${itemId} quantity updated to ${quantity}`);

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

    console.log(`Removing item ${itemId} from cart for user ${userId}`);

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Use string comparison to ensure we find the item regardless of type
    cart.items = cart.items.filter(
      (item) => String(item.itemId) !== String(itemId)
    );

    await cart.save();
    console.log(
      `Item ${itemId} removed from cart, ${cart.items.length} items remain`
    );

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

    console.log(`Clearing cart for user ${userId}`);

    // Use findOneAndDelete with better error handling
    const result = await Cart.findOneAndDelete({ userId });

    // If no cart was found, still return success (idempotent operation)
    if (!result) {
      console.log(
        `No cart found for user ${userId}, but returning success anyway`
      );
    } else {
      console.log(`Cart cleared for user ${userId}`);
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
