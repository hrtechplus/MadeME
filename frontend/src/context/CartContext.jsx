import React, { createContext, useState, useContext, useEffect } from 'react';
import { useApi } from './ApiContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { serviceUrls, handleApiCall } = useApi();
  const userId = localStorage.getItem('userId') || 'user123';

  // Load cart when the provider mounts
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('userCart', JSON.stringify(cart));
      console.log('Cart saved to localStorage:', cart);
    }
  }, [cart, loading]);

  const loadCart = async () => {
    try {
      // First try to load from localStorage
      const savedCart = localStorage.getItem('userCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.length > 0) {
          setCart(parsedCart);
          setLoading(false);
          console.log('Cart loaded from localStorage:', parsedCart);
          return;
        }
      }

      // If localStorage is empty, try to fetch from server
      try {
        const response = await handleApiCall(
          fetch(`${serviceUrls.cart}/api/cart/${userId}`)
        );
        
        if (response && response.items && response.items.length > 0) {
          setCart(response.items);
          localStorage.setItem('userCart', JSON.stringify(response.items));
          console.log('Cart loaded from server:', response.items);
        }
      } catch (err) {
        console.error('Failed to load cart from server:', err);
        // Still set loading to false even if server fetch fails
      }
    } catch (err) {
      console.error('Error in loadCart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item, restaurantId) => {
    try {
      const updatedItem = {
        ...item,
        restaurantId: restaurantId || item.restaurantId,
      };
      
      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex(cartItem => 
        cartItem._id === item._id || cartItem.itemId === item._id
      );

      let updatedCart;
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += 1;
      } else {
        // Add new item
        updatedCart = [...cart, { 
          ...updatedItem, 
          quantity: 1,
          _id: updatedItem._id || updatedItem.itemId
        }];
      }

      // Update state
      setCart(updatedCart);
      
      // Try to sync with server
      try {
        await handleApiCall(
          fetch(`${serviceUrls.cart}/api/cart/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              itemId: item._id,
              name: item.name,
              price: item.price,
              quantity: existingItemIndex >= 0 
                ? updatedCart[existingItemIndex].quantity 
                : 1,
              restaurantId: restaurantId || item.restaurantId || 'default-restaurant'
            }),
          })
        );
        console.log('Item added to cart on server');
      } catch (err) {
        console.error('Failed to add item to cart on server, but added locally:', err);
      }
    } catch (err) {
      console.error('Error adding item to cart:', err);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        return removeFromCart(itemId);
      }

      // Update local state first for responsiveness
      const updatedCart = cart.map(item =>
        (item._id === itemId || item.itemId === itemId) 
          ? { ...item, quantity: newQuantity } 
          : item
      );
      
      setCart(updatedCart);

      // Try to update on server
      try {
        await handleApiCall(
          fetch(`${serviceUrls.cart}/api/cart/${userId}/${itemId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quantity: newQuantity }),
          })
        );
        console.log('Item quantity updated on server');
      } catch (err) {
        console.error('Failed to update quantity on server, but updated locally:', err);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      // Update local state first for responsiveness
      const updatedCart = cart.filter(item => 
        item._id !== itemId && item.itemId !== itemId
      );
      
      setCart(updatedCart);

      // Try to remove from server
      try {
        await handleApiCall(
          fetch(`${serviceUrls.cart}/api/cart/${userId}/${itemId}`, {
            method: 'DELETE',
          })
        );
        console.log('Item removed from cart on server');
      } catch (err) {
        console.error('Failed to remove item on server, but removed locally:', err);
      }
    } catch (err) {
      console.error('Error removing item from cart:', err);
    }
  };

  const clearCart = async () => {
    try {
      // Clear local state first
      setCart([]);
      localStorage.removeItem('userCart');
      
      // Try to clear on server
      try {
        await handleApiCall(
          fetch(`${serviceUrls.cart}/api/cart/${userId}`, {
            method: 'DELETE',
          })
        );
        console.log('Cart cleared on server');
      } catch (err) {
        console.error('Failed to clear cart on server, but cleared locally:', err);
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
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
    loadCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};