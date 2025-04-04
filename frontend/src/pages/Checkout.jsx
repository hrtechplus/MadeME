import React, { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import { useNavigate } from "react-router-dom";
import "../styles/Checkout.css";

const Checkout = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { handleApiCall, serviceUrls } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("Please log in to proceed with checkout");
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

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      setError("Please enter a delivery address");
      return;
    }

    setPaymentProcessing(true);
    try {
      const userId = localStorage.getItem("userId");

      // Create order
      const orderResponse = await handleApiCall(
        fetch(`${serviceUrls.order}/api/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            restaurantId: cart.restaurantId,
            deliveryAddress,
            items: cart.items,
          }),
        })
      );

      const order = orderResponse.data;

      // Create payment intent
      const paymentResponse = await handleApiCall(
        fetch(`${serviceUrls.payment}/api/payment/create-payment-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order._id,
            amount: cart.items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ),
            userId,
            email: localStorage.getItem("email"),
          }),
        })
      );

      const { clientSecret } = paymentResponse.data;

      // Redirect to payment page
      window.location.href = `/payment/${order._id}?client_secret=${clientSecret}`;
    } catch (err) {
      setError("Failed to process payment. Please try again.");
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading checkout...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some items to your cart before checking out!</p>
        <button onClick={() => navigate("/")}>Browse Restaurants</button>
      </div>
    );
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      <div className="checkout-content">
        <div className="delivery-info">
          <h3>Delivery Information</h3>
          <div className="form-group">
            <label htmlFor="address">Delivery Address</label>
            <textarea
              id="address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your delivery address"
              required
            />
          </div>
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="order-items">
            {cart.items.map((item) => (
              <div key={item.itemId} className="order-item">
                <span className="item-name">
                  {item.name} x {item.quantity}
                </span>
                <span className="item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            className="checkout-button"
            onClick={handleCheckout}
            disabled={paymentProcessing}
          >
            {paymentProcessing ? "Processing..." : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
