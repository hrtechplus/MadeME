import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import "../styles/Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceUrls, handleApiCall } = useApi();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    if (location.state?.cart) {
      setCart(location.state.cart);
      setLoading(false);
    } else {
      // If no cart in state, try to fetch from API
      const fetchCart = async () => {
        try {
          const response = await handleApiCall(
            fetch(`${serviceUrls.cart}/cart`)
          );
          setCart(response.items || []);
          setLoading(false);
        } catch (err) {
          setError("Failed to load cart. Please try again later.");
          setLoading(false);
        }
      };

      fetchCart();
    }
  }, [location.state, handleApiCall, serviceUrls.cart]);

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
      return;
    }

    try {
      // Create order
      const orderResponse = await handleApiCall(
        fetch(`${serviceUrls.order}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart,
            deliveryAddress,
            total: cart.reduce(
              (total, item) => total + item.price * item.quantity,
              0
            ),
          }),
        })
      );

      // Clear cart
      await handleApiCall(
        fetch(`${serviceUrls.cart}/cart`, {
          method: "DELETE",
        })
      );

      // Navigate to payment page
      navigate("/payment", { state: { orderId: orderResponse._id } });
    } catch (err) {
      setError("Failed to process checkout. Please try again.");
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading checkout...</div>
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
              <div key={item._id} className="order-item">
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
            <button className="checkout-btn" onClick={handleCheckout}>
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
