import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement } from "@stripe/react-stripe-js";
import "../styles/Payment.css";

const stripePromise = (() => {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!publicKey || publicKey === "your_stripe_public_key_here") {
    console.warn("Stripe public key is not configured");
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
      stripePromise
        .then((stripeInstance) => {
          setStripe(stripeInstance);
        })
        .catch((error) => {
          console.error("Failed to load Stripe:", error);
          setError("Failed to initialize payment system");
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
      <div className="payment">
        <div className="error">
          Payment system is not configured. Please contact support.
        </div>
      </div>
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
  const { handleApiCall, serviceUrls } = useApi();

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await handleApiCall(
          fetch(`${serviceUrls.payment}/api/payment/create-intent/${orderId}`)
        );
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        setError(
          error.message || "Failed to initialize payment. Please try again."
        );
      }
    };

    if (orderId) {
      fetchPaymentIntent();
    }
  }, [orderId, handleApiCall, serviceUrls.payment]);

  if (error) {
    return (
      <div className="payment">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="payment">
        <div className="loading">Loading payment form...</div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="payment">
        <div className="error">
          Payment system is not configured. Please contact support.
        </div>
      </div>
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
