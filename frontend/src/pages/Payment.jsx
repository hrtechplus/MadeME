import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import "../styles/Payment.css";

const stripePromise = (() => {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!publicKey) {
    console.error("Stripe public key is not configured");
    return null;
  }
  return loadStripe(publicKey);
})();

const PaymentForm = ({ clientSecret }) => {
  const [stripe, setStripe] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (stripePromise) {
      stripePromise.then((stripeInstance) => {
        setStripe(stripeInstance);
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe) {
      setError("Payment system is not ready. Please try again later.");
      return;
    }

    setIsProcessing(true);

    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements: {
          clientSecret,
        },
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
      });

      if (stripeError) {
        setError(stripeError.message);
      }
    } catch (error) {
      setError(error.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stripePromise) {
    return (
      <div className="error">Payment system is not configured properly.</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      {error && <div className="error">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="payment-button"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

const Payment = () => {
  const { orderId } = useParams();
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const { handleApiCall } = useApi();

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await handleApiCall(
          fetch(
            `${
              import.meta.env.VITE_PAYMENT_SERVICE_URL
            }/api/payment/create-intent/${orderId}`
          )
        );
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        setError(
          error.message || "Failed to initialize payment. Please try again."
        );
      }
    };

    fetchPaymentIntent();
  }, [orderId, handleApiCall]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!clientSecret) {
    return <div className="loading">Loading payment form...</div>;
  }

  if (!stripePromise) {
    return (
      <div className="error">Payment system is not configured properly.</div>
    );
  }

  return (
    <div className="payment">
      <h2>Complete Your Payment</h2>
      <div className="payment-content">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm clientSecret={clientSecret} />
        </Elements>
      </div>
    </div>
  );
};

export default Payment;
