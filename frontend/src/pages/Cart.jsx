import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../styles/Cart.css";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
  } = useCart();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading cart...</div>
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
              <div key={item.itemId} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p className="price">${item.price.toFixed(2)}</p>
                </div>
                <div className="cart-item-controls">
                  <button
                    onClick={() =>
                      updateQuantity(item.itemId, item.quantity - 1)
                    }
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.itemId, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.itemId)}
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
