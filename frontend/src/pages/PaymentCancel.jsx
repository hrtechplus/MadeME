import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContext } from "../context/ToastContext";
import "../styles/Payment.css";

const PaymentCancel = () => {
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Show toast message
    showToast("Payment was cancelled", "warning");

    // Clear current order ID from session storage if needed
    sessionStorage.removeItem("currentOrderId");

    // Redirect back to cart after 3 seconds
    const timer = setTimeout(() => {
      navigate("/cart");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, showToast]);

  const handleReturn = () => {
    navigate("/cart");
  };

  return (
    <div className="payment-result-container">
      <div className="payment-result">
        <div className="cancel-message">
          <i className="fas fa-times-circle"></i>
          <h2>Payment Cancelled</h2>
          <p>You've cancelled your payment process.</p>
          <p>You will be redirected to your cart shortly.</p>
        </div>
        <button className="return-button" onClick={handleReturn}>
          Return to Cart
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;
