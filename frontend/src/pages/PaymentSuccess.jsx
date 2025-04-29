import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Fade,
  Alert,
} from "@mui/material";
import {
  CheckCircle,
  ErrorOutline,
  ArrowBack,
  Receipt,
} from "@mui/icons-material";
import "../styles/Payment.css";

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const { serviceUrls } = useApi();
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
        const paymentId =
          queryParams.get("paymentId") || sessionStorage.getItem("paymentId");
        const PayerID = queryParams.get("PayerID");
        const paypalOrderId =
          queryParams.get("token") || sessionStorage.getItem("paypalOrderId"); // PayPal returns the order ID as 'token'
        const orderId =
          queryParams.get("orderId") ||
          sessionStorage.getItem("currentOrderId");

        // Detect platform - this could be expanded with more sophisticated detection
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const platform = isMobile ? "mobile" : "web";

        console.log("Payment success params:", {
          paymentId,
          PayerID,
          paypalOrderId,
          orderId,
          platform,
        });

        if (!paymentId && !paypalOrderId && !orderId) {
          throw new Error("Missing required payment parameters");
        }

        // Check if we need to use mock PayPal flow
        const useMockPayPal =
          import.meta.env.VITE_PAYPAL_ENABLE_MOCK === "true" &&
          (!paypalOrderId || paypalOrderId.startsWith("MOCK-"));

        // Always call capture on the backend
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
              mockPayPal: useMockPayPal,
              platform: platform,
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

        // Set order details for display
        setOrderDetails({
          orderId: response.orderId || orderId,
          paymentId: response.paymentId || paymentId,
          status: response.status || "COMPLETED",
          captureId: response.captureId,
        });

        showToast("Payment successful! Your order has been placed.", "success");
        setLoading(false);

        // Clear payment data from session storage
        sessionStorage.removeItem("currentOrderId");
        sessionStorage.removeItem("paypalOrderId");
        sessionStorage.removeItem("paymentId");

        // Redirect to order history after 5 seconds
        setTimeout(() => {
          navigate("/orders");
        }, 5000);
      } catch (err) {
        console.error("Payment capture error:", err);
        setError(err.message || "There was an error processing your payment");
        setLoading(false);
        showToast(err.message || "Payment processing failed", "error");
      }
    };

    capturePayment();
  }, [location, navigate, serviceUrls, showToast]);

  const handleViewOrders = () => {
    navigate("/orders");
  };

  const handleReturnToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <CircularProgress size={60} thickness={4} color="primary" />
          <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
            Processing Your Payment
          </Typography>
          <Typography color="text.secondary">
            Please wait while we confirm your payment...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: "center",
            bgcolor: "#fff8f8",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <ErrorOutline sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
          <Typography
            variant="h5"
            color="error"
            sx={{ mb: 2, fontWeight: 600 }}
          >
            Payment Error
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {error}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleReturnToHome}
            >
              Return to Home
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Receipt />}
              onClick={handleViewOrders}
            >
              View Orders
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Fade in={true}>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <CheckCircle sx={{ fontSize: 70, color: "success.main", mb: 2 }} />
          <Typography
            variant="h4"
            sx={{ mb: 2, fontWeight: 600, color: "success.main" }}
          >
            Payment Successful!
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
            Thank you for your order. Your payment has been processed
            successfully.
          </Typography>

          {orderDetails && (
            <Alert severity="info" sx={{ mb: 4, textAlign: "left" }}>
              <Typography variant="subtitle2">
                Order ID: {orderDetails.orderId}
              </Typography>
              <Typography variant="subtitle2">
                Payment ID: {orderDetails.paymentId}
              </Typography>
              <Typography variant="subtitle2">
                Status: {orderDetails.status}
              </Typography>
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            You will be redirected to your order history in a few seconds...
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleReturnToHome}
            >
              Return to Home
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Receipt />}
              onClick={handleViewOrders}
            >
              View Your Order
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default PaymentSuccess;
