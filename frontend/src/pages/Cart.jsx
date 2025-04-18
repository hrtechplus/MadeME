import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import "../styles/Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const { serviceUrls, handleApiCall } = useApi();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await handleApiCall(fetch(`${serviceUrls.cart}/cart`));
        setCart(response.items || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to load cart. Please try again later.");
        setLoading(false);
      }
    };

    fetchCart();
  }, [handleApiCall, serviceUrls.cart]);

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        await handleApiCall(
          fetch(`${serviceUrls.cart}/cart/items/${itemId}`, {
            method: "DELETE",
          })
        );
        setCart((prevCart) => prevCart.filter((item) => item._id !== itemId));
        return;
      }

      await handleApiCall(
        fetch(`${serviceUrls.cart}/cart/items/${itemId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: newQuantity }),
        })
      );
      setCart((prevCart) =>
        prevCart.map((item) =>
          item._id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      setError("Failed to update item quantity. Please try again.");
    }
  };

  const removeItem = async (itemId) => {
    try {
      await handleApiCall(
        fetch(`${serviceUrls.cart}/cart/items/${itemId}`, {
          method: "DELETE",
        })
      );
      setCart((prevCart) => prevCart.filter((item) => item._id !== itemId));
    } catch (err) {
      setError("Failed to remove item. Please try again.");
    }
  };

  const clearCart = async () => {
    try {
      await handleApiCall(
        fetch(`${serviceUrls.cart}/cart`, {
          method: "DELETE",
        })
      );
      setCart([]);
    } catch (err) {
      setError("Failed to clear cart. Please try again.");
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    navigate("/checkout", { state: { cart } });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading cart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="cart">
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <button
            className="continue-shopping-btn"
            onClick={() => navigate("/restaurants")}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p className="price">${item.price.toFixed(2)}</p>
                </div>
                <div className="cart-item-controls">
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => removeItem(item._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-actions">
            <button className="clear-cart-btn" onClick={clearCart}>
              Clear Cart
            </button>
            <div className="cart-total">
              <h3>Total: ${getTotalPrice().toFixed(2)}</h3>
              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
