import React, { useState } from "react";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import { Box, CircularProgress } from "@mui/material";
import "../styles/PayPalButton.css";

const PayPalButton = ({ orderId, amount, onSuccess, onError, onCancel }) => {
  const { serviceUrls } = useApi();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentWindow, setPaymentWindow] = useState(null);

  const initiatePayment = async () => {
    setIsLoading(true);
    try {
      // Create a PayPal order through our backend
      const response = await fetch(
        `${serviceUrls.payment}/api/payment/paypal/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            orderId,
            amount: parseFloat(amount),
            userId: localStorage.getItem("userId") || "guest-user",
            returnUrl: `${window.location.origin}/payment/success`,
            cancelUrl: `${window.location.origin}/payment/cancel`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Store payment information for verification
      sessionStorage.setItem("paypalOrderId", data.paypalOrderId);
      sessionStorage.setItem("mademeOrderId", orderId);
      sessionStorage.setItem("paymentId", data.paymentId);

      // Open PayPal in a popup window
      openPayPalPopup(data.approvalUrl);

      // Start polling for payment status
      startPaymentStatusPolling(data.paymentId);
    } catch (error) {
      console.error("PayPal payment initiation error:", error);
      showToast("Failed to initiate PayPal payment", "error");
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openPayPalPopup = (url) => {
    // Set popup window features
    const width = 450;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    const features = `
      width=${width},
      height=${height},
      top=${top},
      left=${left},
      status=yes,
      toolbar=no,
      menubar=no,
      resizable=yes,
      scrollbars=yes
    `;

    // Open popup window
    const popup = window.open(url, "PayPal Checkout", features);

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      // Popup blocked
      showToast("Popup blocked! Please allow popups for this site.", "error");

      // Fallback: Open in new tab
      window.open(url, "_blank");
    } else {
      setPaymentWindow(popup);

      // Poll to detect when the popup is closed
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval);
          showToast("PayPal window was closed", "info");
        }
      }, 1000);
    }
  };

  const startPaymentStatusPolling = (paymentId) => {
    if (!paymentId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${serviceUrls.payment}/api/payment/verify/${paymentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Payment verification failed");
        }

        const data = await response.json();

        if (data.status === "COMPLETED") {
          clearInterval(pollInterval);
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.close();
          }
          if (onSuccess) onSuccess(data);
          showToast("Payment completed successfully!", "success");
        } else if (data.status === "FAILED") {
          clearInterval(pollInterval);
          if (onError) onError(new Error("Payment failed"));
          showToast("Payment failed", "error");
        } else if (data.status === "CANCELLED") {
          clearInterval(pollInterval);
          if (onCancel) onCancel();
          showToast("Payment was cancelled", "warning");
        }
        // For "PENDING" status, we continue polling
      } catch (error) {
        console.error("Payment verification error:", error);
        // Don't stop polling on verification errors - retry
      }
    }, 3000); // Check every 3 seconds

    // Store interval ID in session storage to clear it if page refreshes
    sessionStorage.setItem("paymentPollInterval", pollInterval);

    // Stop polling after 5 minutes (failsafe)
    setTimeout(() => {
      clearInterval(pollInterval);
      sessionStorage.removeItem("paymentPollInterval");
    }, 5 * 60 * 1000);
  };

  return (
    <button
      className="paypal-button"
      onClick={initiatePayment}
      disabled={isLoading}
    >
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
          <CircularProgress size={20} sx={{ color: "#003087" }} />
          <span>Connecting to PayPal...</span>
        </Box>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center">
          <img
            src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg"
            alt="PayPal"
            className="paypal-logo"
            style={{ height: 24, marginRight: 12 }}
          />
          <span>Pay with PayPal</span>
        </Box>
      )}
    </button>
  );
};

export default PayPalButton;
