import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { Container, Paper, Typography, Button, Box, Fade } from "@mui/material";
import {
  Cancel,
  ShoppingCartOutlined,
  PaymentOutlined,
} from "@mui/icons-material";
import "../styles/Payment.css";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // Get stored order information
    const orderId = sessionStorage.getItem("mademeOrderId");

    if (orderId) {
      // Show cancelled message
      showToast("Payment was cancelled", "warning");

      // Close the popup if it's in a popup
      if (window.opener && !window.opener.closed) {
        // Notify the parent window
        window.opener.postMessage(
          { type: "PAYMENT_CANCELLED", orderId },
          window.location.origin
        );
        // Close this window after a brief delay
        setTimeout(() => window.close(), 1000);
      }
    } else {
      // No order info, redirect to home
      navigate("/", { replace: true });
    }
  }, [navigate, showToast]);

  const handleReturnToPayment = () => {
    const orderId = sessionStorage.getItem("mademeOrderId");
    navigate("/payment", {
      state: {
        orderId,
        amount: sessionStorage.getItem("paymentAmount"),
      },
    });
  };

  const handleReturnToCart = () => {
    navigate("/cart");
  };

  return (
    <Container maxWidth="md" className="payment-container">
      <Fade in={true} timeout={800}>
        <Paper elevation={0} className="payment-cancel">
          <Cancel fontSize="large" color="error" />
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 600, color: "#dc2626" }}
          >
            Payment Cancelled
          </Typography>
          <Typography variant="body1" paragraph>
            Your payment has been cancelled. No charges have been made.
          </Typography>
          <Box
            sx={{
              bgcolor: "rgba(239, 68, 68, 0.08)",
              p: 2,
              borderRadius: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <PaymentOutlined color="error" />
            <Typography variant="body2" color="text.secondary">
              You can try again with a different payment method or return to
              your cart.
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            You can now close this window if it opened as a popup, or use one of
            the buttons below.
          </Typography>
          <Box
            mt={3}
            display="flex"
            gap={2}
            justifyContent="center"
            flexWrap="wrap"
          >
            <Button
              variant="outlined"
              color="primary"
              size="large"
              onClick={handleReturnToCart}
              startIcon={<ShoppingCartOutlined />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.25,
                minWidth: 180,
              }}
            >
              Return to Cart
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleReturnToPayment}
              startIcon={<PaymentOutlined />}
              sx={{
                borderRadius: 2,
                boxShadow: "0 4px 8px rgba(37, 99, 235, 0.15)",
                px: 3,
                py: 1.25,
                minWidth: 180,
              }}
            >
              Try Again
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default PaymentCancel;
