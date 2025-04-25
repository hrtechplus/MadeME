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
  const [paymentMethod, setPaymentMethod] = useState("CARD");
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
      navigate("/", { replace: true });
    }
  }, [orderId, amount, showToast, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleCODPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await handleApiCall(
        fetch(`${serviceUrls.payment}/api/payment/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            orderId,
            amount,
            paymentMethod: "COD",
            userId: localStorage.getItem("userId"),
          }),
        })
      );

      if (response.data.success || response.status === 200) {
        setSuccess(true);
        showToast("Order placed successfully with COD!", "success");
        setTimeout(() => {
          navigate("/orders", {
            state: {
              message: "Order placed successfully with Cash on Delivery!",
              orderId: response.data?.paymentId || orderId,
            },
          });
        }, 3000);
      } else {
        setError(
          response.data.message ||
            "Failed to place COD order. Please try again."
        );
        showToast(response.data.message || "Failed to place order", "error");
      }
    } catch (err) {
      setError(err.message || "Error processing COD order. Please try again.");
      showToast("Error processing order", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create a PayPal order
      const response = await handleApiCall(
        fetch(`${serviceUrls.payment}/api/payment/paypal/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            orderId,
            amount,
            userId: localStorage.getItem("userId"),
          }),
        })
      );

      if (response.data && response.data.success && response.data.approvalUrl) {
        // Redirect to PayPal for payment approval
        window.location.href = response.data.approvalUrl;
      } else {
        setError("Failed to initiate PayPal payment. Please try again.");
        showToast("Failed to initiate PayPal payment", "error");
      }
    } catch (err) {
      setError(
        err.message || "Error initiating PayPal payment. Please try again."
      );
      showToast("Error initiating PayPal payment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First get stripe client secret from the payment service
      const intentResponse = await handleApiCall(
        fetch(`${serviceUrls.payment}/api/payment/initiate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            orderId,
            amount,
            userId: localStorage.getItem("userId"),
            email: cardDetails.name.replace(/\s/g, "") + "@example.com", // Generate email from name for demo
          }),
        })
      );

      // Process the card payment
      const paymentResponse = await handleApiCall(
        fetch(`${serviceUrls.payment}/api/payment/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            orderId,
            amount,
            paymentMethod: "CARD",
            cardDetails: {
              ...cardDetails,
              // In a real app, you would not send raw card details directly
              // This is just for demonstration purposes
            },
          }),
        })
      );

      if (paymentResponse.data.success) {
        // Demo successful payment
        setSuccess(true);
        showToast("Card payment successful!", "success");

        setTimeout(() => {
          navigate("/orders", {
            state: {
              message: "Order placed successfully with card payment!",
              orderId: paymentResponse.data?.paymentId || orderId,
            },
          });
        }, 3000);
      } else {
        setError(
          paymentResponse.data.message || "Payment failed. Please try again."
        );
        showToast(paymentResponse.data.message || "Payment failed", "error");
      }
    } catch (err) {
      setError(
        err.message || "Error processing card payment. Please try again."
      );
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
        <h2>Payment Method</h2>
        <p className="order-amount">Total Amount: ${amount?.toFixed(2)}</p>

        <div className="payment-methods">
          <div
            className={`payment-method ${
              paymentMethod === "CARD" ? "selected" : ""
            }`}
            onClick={() => handlePaymentMethodChange("CARD")}
          >
            <div className="method-icon card-icon">💳</div>
            <div className="method-name">Credit/Debit Card</div>
          </div>
          <div
            className={`payment-method ${
              paymentMethod === "PAYPAL" ? "selected" : ""
            }`}
            onClick={() => handlePaymentMethodChange("PAYPAL")}
          >
            <div className="method-icon paypal-icon">
              <span style={{ color: "#003087" }}>Pay</span>
              <span style={{ color: "#009cde" }}>Pal</span>
            </div>
            <div className="method-name">PayPal</div>
          </div>
          <div
            className={`payment-method ${
              paymentMethod === "COD" ? "selected" : ""
            }`}
            onClick={() => handlePaymentMethodChange("COD")}
          >
            <div className="method-icon cod-icon">💵</div>
            <div className="method-name">Cash on Delivery</div>
          </div>
        </div>

        {paymentMethod === "CARD" && (
          <form onSubmit={handleCardPayment}>
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
                  Processing Card...
                </div>
              ) : (
                "Pay with Card"
              )}
            </button>
          </form>
        )}

        {paymentMethod === "PAYPAL" && (
          <div className="paypal-section">
            <p className="paypal-info">
              Pay securely using your PayPal account. You will be redirected to
              PayPal to complete your payment.
            </p>
            <button
              className="pay-button paypal-button"
              onClick={handlePayPalPayment}
              disabled={loading}
            >
              {loading ? (
                <div className="button-loading">
                  <div className="spinner"></div>
                  Processing...
                </div>
              ) : (
                "Pay with PayPal"
              )}
            </button>
          </div>
        )}

        {paymentMethod === "COD" && (
          <div className="cod-section">
            <p className="cod-info">
              Pay with cash when your order is delivered. Our delivery agent
              will collect the payment.
            </p>
            <button
              className="pay-button cod-button"
              onClick={handleCODPayment}
              disabled={loading}
            >
              {loading ? (
                <div className="button-loading">
                  <div className="spinner"></div>
                  Processing...
                </div>
              ) : (
                "Place Order with COD"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
