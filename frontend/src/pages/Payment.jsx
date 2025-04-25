import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import "../styles/Payment.css";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const orderId = location.state?.orderId;
  const amount = location.state?.amount;

  useEffect(() => {
    if (!orderId || !amount) {
      setError("Invalid order details. Please try again.");
      showToast("Invalid order details", "error");
    }
  }, [orderId, amount, showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await handleApiCall(
        fetch(`${serviceUrls.payment}/api/payment/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            amount,
            cardDetails,
          }),
        })
      );

      if (response.data.success) {
        setSuccess(true);
        showToast("Payment successful!", "success");
        // Show success message for 3 seconds then redirect
        setTimeout(() => {
          navigate("/orders", {
            state: {
              message: "Order placed successfully!",
              orderId: response.data.paymentId,
            },
          });
        }, 3000);
      } else {
        setError(response.data.message || "Payment failed. Please try again.");
        showToast(response.data.message || "Payment failed", "error");
      }
    } catch (err) {
      setError(err.message || "Error processing payment. Please try again.");
      showToast("Error processing payment", "error");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="payment-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={() => setError(null)}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="payment-container">
        <div className="success-message">
          <h2>Payment Successful!</h2>
          <p>Your order has been placed successfully.</p>
          <div className="loading-spinner"></div>
          <p>Redirecting to orders page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h2>Payment Details</h2>
        <p className="order-amount">Total Amount: ${amount?.toFixed(2)}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Cardholder Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={cardDetails.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="number">Card Number</label>
            <input
              type="text"
              id="number"
              name="number"
              value={cardDetails.number}
              onChange={handleInputChange}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiry">Expiry Date</label>
              <input
                type="text"
                id="expiry"
                name="expiry"
                value={cardDetails.expiry}
                onChange={handleInputChange}
                placeholder="MM/YY"
                maxLength="5"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                value={cardDetails.cvv}
                onChange={handleInputChange}
                placeholder="123"
                maxLength="3"
                required
              />
            </div>
          </div>

          <button type="submit" className="pay-button" disabled={loading}>
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Processing...
              </div>
            ) : (
              "Pay Now"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Payment;
