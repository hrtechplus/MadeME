import React, { createContext, useState, useContext, useEffect } from "react";
import { useApi } from "./ApiContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { serviceUrls, handleApiCall } = useApi();
  const userId = localStorage.getItem("userId") || "user123";

  // Load cart from MongoDB when the provider mounts
  useEffect(() => {
    loadCartFromDB();
  }, []);

  const loadCartFromDB = async () => {
    try {
      console.log("Loading cart from database for user:", userId);
      setLoading(true);

      const response = await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}`)
      );

      if (response && response.items) {
        setCart(response.items);
        console.log("Cart loaded from database:", response.items);
      } else {
        setCart([]);
        console.log("No items in cart");
      }
    } catch (err) {
      console.error("Failed to load cart from database:", err);
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item, restaurantId) => {
    try {
      console.log("Adding item to cart:", item);

      // Prepare the item for adding to cart
      const cartItem = {
        itemId: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        restaurantId: restaurantId || item.restaurantId || "default-restaurant",
      };

      // Add to database
      const response = await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            ...cartItem,
          }),
        })
      );

      // Refresh cart from database to ensure we have the latest data
      await loadCartFromDB();

      console.log("Item added to cart in database");
    } catch (err) {
      console.error("Error adding item to cart:", err);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        return removeFromCart(itemId);
      }

      console.log(`Updating quantity of item ${itemId} to ${newQuantity}`);

      // Update in database
      await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}/${itemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: newQuantity }),
        })
      );

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

      // Remove from database
      await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}/${itemId}`, {
          method: "DELETE",
        })
      );

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
      await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}`, {
          method: "DELETE",
        })
      );

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
