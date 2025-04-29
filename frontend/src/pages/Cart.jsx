import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { ApiContext } from "../context/ApiContext";
import { ToastContext } from "../context/ToastContext";
import "../styles/Cart.css";

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, clearCart } =
    useContext(CartContext);
  const { api } = useContext(ApiContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedOrder, setModifiedOrder] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    // Check URL for order modification mode
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("modify");

    if (orderId) {
      setIsModifying(true);
      // Fetch the order to be modified
      loadOrderForModification(orderId);
    }
  }, []);

  const loadOrderForModification = async (orderId) => {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      setModifiedOrder(response.data);

      // Pre-fill the cart with order items
      clearCart();
      response.data.items.forEach((item) => {
        updateCartItem({
          ...item,
          quantity: item.quantity,
        });
      });

      // Set special instructions if any
      if (response.data.specialInstructions) {
        setSpecialInstructions(response.data.specialInstructions);
      }

      showToast("Order loaded for modification", "info");
    } catch (error) {
      console.error("Error loading order for modification:", error);
      showToast("Could not load order for modification", "error");
    }
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity >= 1) {
      updateCartItem({
        ...item,
        quantity: newQuantity,
      });
    }
  };

  const handleRemoveItem = (item) => {
    removeFromCart(item);
  };

  const calculateTotal = () => {
    return cart
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      showToast("Your cart is empty", "warning");
      return;
    }

    if (isModifying && modifiedOrder) {
      handleModifyOrder();
    } else {
      navigate("/checkout", {
        state: {
          cartItems: cart,
          total: calculateTotal(),
          specialInstructions,
        },
      });
    }
  };

  const handleModifyOrder = async () => {
    try {
      const orderData = {
        items: cart.map((item) => ({
          itemId: item.itemId || item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        specialInstructions,
        deliveryAddress: modifiedOrder.deliveryAddress,
      };

      const response = await api.patch(
        `/api/orders/${modifiedOrder._id}/modify`,
        orderData
      );

      if (response.data.success) {
        showToast("Order modified successfully", "success");
        // Clear the cart and redirect to order tracking
        clearCart();
        navigate(`/order-tracking/${modifiedOrder._id}`);
      }
    } catch (error) {
      console.error("Error modifying order:", error);
      showToast(
        "Failed to modify order. " +
          (error.response?.data?.message || "Please try again."),
        "error"
      );
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1 className="cart-title">
          {isModifying ? "Modify Order" : "Your Cart"}
        </h1>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <p>Your cart is empty</p>
            <button
              className="browse-btn"
              onClick={() => navigate("/restaurants")}
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.map((item, index) => (
                <div className="cart-item" key={index}>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="item-price">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="item-actions">
                    <div className="quantity-controls">
                      <button
                        className="quantity-btn"
                        onClick={() =>
                          handleQuantityChange(item, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        <span>-</span>
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() =>
                          handleQuantityChange(item, item.quantity + 1)
                        }
                      >
                        <span>+</span>
                      </button>
                    </div>
                    <div className="item-total">
                      <p>${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="special-instructions">
              <h3>Special Instructions</h3>
              <textarea
                rows="3"
                placeholder="Add any special instructions or requests..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              ></textarea>
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${calculateTotal()}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee:</span>
                <span>$3.99</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>${(parseFloat(calculateTotal()) + 3.99).toFixed(2)}</span>
              </div>

              <div className="cart-actions">
                <button className="continue-btn" onClick={() => navigate(-1)}>
                  Continue Shopping
                </button>
                <button
                  className="checkout-btn"
                  onClick={handleProceedToCheckout}
                  disabled={cart.length === 0}
                >
                  {isModifying ? "Save Changes" : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
