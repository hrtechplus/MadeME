import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import "../styles/Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();
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
          const userId = localStorage.getItem("userId") || "test-user";
          const response = await handleApiCall(
            fetch(`http://localhost:5003/api/cart/${userId}`)
          );
          setCart(response.data?.items || []);
          setLoading(false);
        } catch (err) {
          setError("Failed to load cart. Please try again later.");
          showToast("Failed to load cart", "error");
          setLoading(false);
        }
      };

      fetchCart();
    }
  }, [location.state, handleApiCall, serviceUrls.cart, showToast]);

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
        userId: localStorage.getItem("userId") || "test-user",
        restaurantId: cart[0]?.restaurantId || "default-restaurant",
        items: cart.map((item) => ({
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        deliveryAddress,
        total: cart.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
        status: "PENDING",
      };

      // Use hardcoded URLs for now to ensure correct ports are used
      const orderResponse = await handleApiCall(
        fetch("http://localhost:5001/api/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        })
      );

      // Clear cart - using hardcoded URL to avoid port confusion
      await handleApiCall(
        fetch(
          `http://localhost:5003/api/cart/${
            localStorage.getItem("userId") || "test-user"
          }`,
          {
            method: "DELETE",
          }
        )
      );

      showToast("Order created successfully", "success");
      // Navigate to payment page with order details
      navigate("/payment", {
        state: {
          orderId: orderResponse.data._id,
          amount: orderResponse.data.total,
        },
      });
    } catch (err) {
      setError("Failed to process checkout. Please try again.");
      showToast("Failed to process checkout", "error");
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
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
