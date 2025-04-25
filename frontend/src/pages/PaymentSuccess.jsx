import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import "../styles/Payment.css";

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { serviceUrls } = useApi();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const capturePayment = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const paymentId = queryParams.get("paymentId");
        const PayerID = queryParams.get("PayerID");
        const orderId = sessionStorage.getItem("currentOrderId");

        if (!paymentId || !PayerID || !orderId) {
          throw new Error("Missing required payment parameters");
        }

        const response = await fetch(
          `${serviceUrls.payment}/api/payments/paypal/capture`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              paymentId,
              PayerID,
              orderId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to capture payment");
        }

        showToast("Payment successful! Your order has been placed.", "success");
        setLoading(false);

        // Clear current order ID from session storage
        sessionStorage.removeItem("currentOrderId");

        // Redirect to order history after 3 seconds
        setTimeout(() => {
          navigate("/order-history");
        }, 3000);
      } catch (err) {
        console.error("Payment capture error:", err);
        setError(err.message || "There was an error processing your payment");
        setLoading(false);
        showToast(err.message || "Payment processing failed", "error");
      }
    };

    capturePayment();
  }, [location, navigate, serviceUrls, showToast]);

  const handleReturn = () => {
    navigate("/order-history");
  };

  if (loading) {
    return (
      <div className="payment-result-container">
        <div className="payment-result">
          <h2>Processing Your Payment</h2>
          <div className="loading-spinner"></div>
          <p>Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-result-container">
        <div className="payment-result">
          <h2>Payment Error</h2>
          <div className="error-message">
            <p>{error}</p>
          </div>
          <button className="return-button" onClick={handleReturn}>
            Return to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className="payment-result">
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <h2>Payment Successful!</h2>
          <p>
            Thank you for your order. Your payment has been processed
            successfully.
          </p>
          <p>You will be redirected to your order history shortly.</p>
        </div>
        <button className="return-button" onClick={handleReturn}>
          View Your Orders
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
