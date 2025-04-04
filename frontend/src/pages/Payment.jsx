import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/stripe-js";
import { PaymentElement } from "@stripe/react-stripe-js";
import "../styles/Payment.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ clientSecret }) => {
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { handleApiCall } = useApi();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    try {
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.confirmPayment({
        elements: {
          clientSecret,
        },
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
      });

      if (stripeError) {
        setError(stripeError.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={processing} className="pay-button">
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

const Payment = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { handleApiCall } = useApi();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const response = await handleApiCall(
          fetch(`http://localhost:5003/api/payment/status/${orderId}`)
        );

        if (response.data.status === "succeeded") {
          window.location.href = "/orders";
        }
      } catch (err) {
        setError("Failed to verify payment status. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [orderId, handleApiCall]);

  const clientSecret = searchParams.get("client_secret");

  if (loading) {
    return <div className="loading">Loading payment form...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!clientSecret) {
    return (
      <div className="error">
        Invalid payment session. Please try checking out again.
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
