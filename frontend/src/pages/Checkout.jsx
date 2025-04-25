import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";
import "../styles/Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();
  const { cart, clearCart, getTotalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const userId = localStorage.getItem("userId") || "user123";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckout = async () => {
    if (
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.zipCode
    ) {
      setError("Please fill in all delivery address fields");
      showToast("Please fill in all delivery address fields", "error");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty");
      showToast("Your cart is empty", "error");
      return;
    }

    try {
      setLoading(true);

      // Create order
      const orderData = {
        userId: userId,
        restaurantId: cart[0]?.restaurantId || "default-restaurant",
        items: cart.map((item) => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        deliveryAddress,
        total: getTotalPrice(),
        status: "PENDING",
      };

      console.log("Creating order with data:", orderData);

      // Create order with proper error handling
      const orderResponse = await fetch(`${serviceUrls.order}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(
          errorData.message ||
            `Error ${orderResponse.status}: Failed to create order`
        );
      }

      const orderResult = await orderResponse.json();
      console.log("Order created successfully:", orderResult);

      // Clear cart using our context method (handles database clearing)
      await clearCart();

      showToast("Order created successfully", "success");

      // Navigate to payment page with order details
      navigate("/payment", {
        state: {
          orderId: orderResult._id,
          amount: orderResult.total,
        },
      });
    } catch (err) {
      setError(`Failed to process checkout: ${err.message}`);
      showToast("Failed to process checkout", "error");
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Processing checkout...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">Error: {error}</div>
        <button className="retry-btn" onClick={() => setError(null)}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      <div className="checkout-content">
        <div className="delivery-address">
          <h3>Delivery Address</h3>
          <div className="address-form">
            <div className="form-group">
              <label htmlFor="street">Street Address</label>
              <input
                type="text"
                id="street"
                name="street"
                value={deliveryAddress.street}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={deliveryAddress.city}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={deliveryAddress.state}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="zipCode">ZIP Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={deliveryAddress.zipCode}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="order-items">
            {cart.map((item) => (
              <div key={item.itemId} className="order-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>Quantity: {item.quantity}</p>
                </div>
                <p className="price">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="order-total">
            <h4>Total: ${getTotalPrice().toFixed(2)}</h4>
            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
