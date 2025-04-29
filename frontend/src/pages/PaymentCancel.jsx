import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useApi } from "../context/ApiContext";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Fade,
  Alert,
} from "@mui/material";
import { Cancel, ArrowBack, ShoppingCart } from "@mui/icons-material";
import "../styles/Payment.css";

const PaymentCancel = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceUrls } = useApi();

  useEffect(() => {
    const handleCancellation = async () => {
      try {
        // Get any query parameters that might have been passed back
        const queryParams = new URLSearchParams(location.search);
        const paypalOrderId =
          queryParams.get("token") || sessionStorage.getItem("paypalOrderId");
        const orderId = sessionStorage.getItem("currentOrderId");

        console.log("Payment cancellation flow:", {
          paypalOrderId,
          orderId,
        });

        // Notify backend about cancellation if we have an order ID or paypal order ID
        if (orderId || paypalOrderId) {
          try {
            await fetch(`${serviceUrls.payment}/api/payment/cancel`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                orderId,
                paypalOrderId,
                reason: "user_cancelled",
              }),
            });
            console.log("Payment cancellation notified to server");
          } catch (error) {
            console.error("Failed to notify payment cancellation:", error);
          }
        }

        // Show toast message
        showToast("Payment was cancelled", "warning");

        // Clear payment data from session storage
        sessionStorage.removeItem("currentOrderId");
        sessionStorage.removeItem("paypalOrderId");
        sessionStorage.removeItem("paymentId");
      } catch (err) {
        console.error("Error in payment cancellation flow:", err);
      }
    };

    handleCancellation();

    // Redirect back to cart after 5 seconds
    const timer = setTimeout(() => {
      navigate("/cart");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, showToast, location, serviceUrls]);

  const handleReturnToCart = () => {
    navigate("/cart");
  };

  const handleReturnToHome = () => {
    navigate("/");
  };

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
          <Cancel sx={{ fontSize: 70, color: "warning.main", mb: 2 }} />
          <Typography
            variant="h4"
            sx={{ mb: 2, fontWeight: 600, color: "warning.main" }}
          >
            Payment Cancelled
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>
            You've cancelled your payment process.
          </Typography>

          <Alert severity="info" sx={{ mb: 4, textAlign: "left" }}>
            <Typography variant="body2">
              Your order has not been completed and no payment has been
              processed. You can try again or choose a different payment method.
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            You will be redirected to your cart in a few seconds...
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
              startIcon={<ShoppingCart />}
              onClick={handleReturnToCart}
            >
              Return to Cart
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default PaymentCancel;
