import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import "../styles/Payment.css";

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const captureAttempted = useRef(false);

  useEffect(() => {
    const capturePayment = async () => {
      // Add this check to prevent multiple capture attempts
      if (captureAttempted.current) {
        console.log("Payment capture already attempted, skipping");
        return;
      }

      // Set flag to true to prevent future capture attempts
      captureAttempted.current = true;

      try {
        console.log("Processing payment success flow");
        const queryParams = new URLSearchParams(location.search);
        const paymentId = queryParams.get("paymentId");
        const PayerID = queryParams.get("PayerID");
        const paypalOrderId = queryParams.get("token"); // PayPal returns the order ID as 'token'
        const isMockPayPal = queryParams.get("mockPayPal") === "true";
        const orderId = sessionStorage.getItem("currentOrderId");

        console.log("Payment success params:", {
          paymentId,
          PayerID,
          paypalOrderId,
          isMockPayPal,
          orderId,
        });

        if (!paymentId && !paypalOrderId && !orderId) {
          throw new Error("Missing required payment parameters");
        }

        // Always call capture on the backend, whether mock or real
        // This ensures consistent processing and database updates
        const fetchResponse = await fetch(
          `${serviceUrls.payment}/api/payment/paypal/capture`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              paypalOrderId: paypalOrderId || `MOCK-ORDER-${Date.now()}`,
              PayerID: PayerID || "MOCK-PAYER",
              orderId: orderId || null,
              mockPayPal: isMockPayPal || false,
              paymentId: paymentId || null,
            }),
          }
        );

        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Request failed with status ${fetchResponse.status}`
          );
        }

        const response = await fetchResponse.json();
        console.log("Payment capture response:", response);

        if (!response || !response.success) {
          throw new Error(response?.message || "Failed to capture payment");
        }

        showToast("Payment successful! Your order has been placed.", "success");
        setLoading(false);

        // Clear current order ID from session storage
        sessionStorage.removeItem("currentOrderId");

        // Redirect to order history after 3 seconds
        setTimeout(() => {
          navigate("/orders");
        }, 3000);
      } catch (err) {
        console.error("Payment capture error:", err);
        setError(err.message || "There was an error processing your payment");
        setLoading(false);
        showToast(err.message || "Payment processing failed", "error");
      }
    };

    capturePayment();
  }, [location, navigate, serviceUrls, showToast, handleApiCall]);

  const handleReturn = () => {
    navigate("/orders");
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
