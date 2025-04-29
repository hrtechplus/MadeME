import React, { createContext, useState, useContext, useEffect } from "react";
import { useApi } from "./ApiContext";
import axios from "axios";

// Create context and export it
const CartContext = createContext();
export { CartContext };

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { serviceUrls, handleApiCall } = useApi();
  const userId = localStorage.getItem("userId") || "user123";
  const token = localStorage.getItem("token");

  // Load cart from MongoDB when the provider mounts
  useEffect(() => {
    loadCartFromDB();
  }, []);

  const loadCartFromDB = async () => {
    try {
      console.log("Loading cart from database for user:", userId);
      setLoading(true);

      const result = await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      // The handleApiCall returns {data, status}
      if (result && result.data && result.data.items) {
        setCart(result.data.items);
        console.log("Cart loaded from database:", result.data.items);
      } else {
        setCart([]);
        console.log("No items in cart or empty response:", result);
      }
    } catch (err) {
      console.error("Failed to load cart from database:", err);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item) => {
    try {
      console.log("Adding item to cart:", item);

      // Validate required fields with better error logging
      if (!item.name) {
        console.error("Missing name in cart item:", item);
        return false;
      }
      if (typeof item.price !== "number" || isNaN(item.price)) {
        console.error("Invalid price in cart item:", item);
        return false;
      }
      if (
        !item.quantity ||
        typeof item.quantity !== "number" ||
        item.quantity < 1
      ) {
        console.error("Invalid quantity in cart item:", item);
        return false;
      }
      if (!item.restaurantId) {
        console.error("Missing restaurantId in cart item:", item);
        return false;
      }
      if (!item.itemId) {
        console.error("Missing itemId in cart item:", item);
        return false;
      }

      // Ensure itemId is a string
      const normalizedItemId = item.itemId.toString();

      // Create the data object with all required fields
      const cartItemData = {
        userId, // This is from the enclosing scope (current user)
        itemId: normalizedItemId,
        name: item.name,
        price: parseFloat(item.price), // Ensure price is a float
        quantity: parseInt(item.quantity, 10), // Ensure quantity is an integer
        restaurantId: item.restaurantId,
      };

      console.log("Sending cart data:", cartItemData);

      // Use direct axios call with proper headers
      const response = await axios.post(
        `${serviceUrls.cart}/api/cart/add`,
        cartItemData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Add to cart response:", response.data);

      // Refresh cart from database to ensure we have the latest data
      await loadCartFromDB();

      console.log("Item added to cart in database");
      return true; // Return success status
    } catch (err) {
      console.error(
        "Error adding item to cart:",
        err.response ? err.response.data : err
      );
      return false; // Return failure status
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        return removeFromCart(itemId);
      }

      console.log(`Updating quantity of item ${itemId} to ${newQuantity}`);

      // Make sure we're using the raw itemId without any prefixes
      const normalizedItemId = itemId.includes("-")
        ? itemId.split("-").pop()
        : itemId;

      // Update in database
      const result = await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}/${normalizedItemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: newQuantity }),
        })
      );

      console.log("Update quantity response:", result);

      // Refresh cart from database
      await loadCartFromDB();

      console.log("Item quantity updated in database");
    } catch (err) {
      console.error("Error updating quantity:", err);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      console.log("Removing item from cart:", itemId);

      // Make sure we're using the raw itemId without any prefixes
      const normalizedItemId = itemId.includes("-")
        ? itemId.split("-").pop()
        : itemId;

      // Remove from database
      const result = await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}/${normalizedItemId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      console.log("Remove from cart response:", result);

      // Refresh cart from database
      await loadCartFromDB();

      console.log("Item removed from cart in database");
    } catch (err) {
      console.error("Error removing item from cart:", err);
    }
  };

  const clearCart = async () => {
    try {
      console.log("Clearing cart");

      // Clear from database
      const result = await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      console.log("Clear cart response:", result);

      // Update local state
      setCart([]);

      console.log("Cart cleared from database");
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getCartCount,
    loadCartFromDB,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
