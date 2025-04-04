import React, { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import { useNavigate } from "react-router-dom";
import "../styles/Cart.css";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { handleApiCall, serviceUrls } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("Please log in to view your cart");
        setLoading(false);
        return;
      }

      try {
        const response = await handleApiCall(
          fetch(`${serviceUrls.cart}/api/cart/${userId}`)
        );
        setCart(response.data);
      } catch (err) {
        setError("Failed to fetch cart. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [handleApiCall, serviceUrls.cart]);

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const userId = localStorage.getItem("userId");
      await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}/item/${itemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: newQuantity }),
        })
      );

      setCart((prevCart) => ({
        ...prevCart,
        items: prevCart.items.map((item) =>
          item.itemId === itemId ? { ...item, quantity: newQuantity } : item
        ),
      }));
    } catch (err) {
      setError("Failed to update quantity. Please try again.");
    }
  };

  const removeItem = async (itemId) => {
    try {
      const userId = localStorage.getItem("userId");
      await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}/item/${itemId}`, {
          method: "DELETE",
        })
      );

      setCart((prevCart) => ({
        ...prevCart,
        items: prevCart.items.filter((item) => item.itemId !== itemId),
      }));
    } catch (err) {
      setError("Failed to remove item. Please try again.");
    }
  };

  const clearCart = async () => {
    try {
      const userId = localStorage.getItem("userId");
      await handleApiCall(
        fetch(`${serviceUrls.cart}/api/cart/${userId}`, {
          method: "DELETE",
        })
      );

      setCart({ items: [] });
    } catch (err) {
      setError("Failed to clear cart. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading">Loading cart...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some delicious items to your cart!</p>
        <button onClick={() => navigate("/")}>Browse Restaurants</button>
      </div>
    );
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart">
      <h2>Your Cart</h2>
      <div className="cart-items">
        {cart.items.map((item) => (
          <div key={item.itemId} className="cart-item">
            <div className="item-info">
              <h3>{item.name}</h3>
              <p className="price">${item.price.toFixed(2)}</p>
            </div>
            <div className="item-actions">
              <div className="quantity-control">
                <button
                  onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <button
                className="remove-btn"
                onClick={() => removeItem(item.itemId)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <div className="total">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="cart-actions">
          <button className="clear-btn" onClick={clearCart}>
            Clear Cart
          </button>
          <button
            className="checkout-btn"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
