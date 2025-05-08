import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { Container, Paper, Typography, Button, Box, Fade } from "@mui/material";
import { CheckCircleOutline, ReceiptLongOutlined } from "@mui/icons-material";
import "../styles/Payment.css";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // Get stored order information
    const orderId = sessionStorage.getItem("mademeOrderId");
    const paymentId = sessionStorage.getItem("paymentId");

    if (orderId && paymentId) {
      // Show success message
      showToast("Payment completed successfully!", "success");

      // Clear session storage
      sessionStorage.removeItem("mademeOrderId");
      sessionStorage.removeItem("paypalOrderId");
      sessionStorage.removeItem("paymentId");
      sessionStorage.removeItem("paypalCheckoutUrl");

      // Close the popup if it's in a popup
      if (window.opener && !window.opener.closed) {
        // Notify the parent window
        window.opener.postMessage(
          { type: "PAYMENT_SUCCESS", orderId, paymentId },
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

  const handleViewOrders = () => {
    const orderId = sessionStorage.getItem("mademeOrderId");
    navigate("/orders", {
      state: {
        message: "Your payment was successful!",
        orderId,
      },
    });
  };

  return (
    <Container maxWidth="md" className="payment-container">
      <Fade in={true} timeout={800}>
        <Paper elevation={0} className="payment-success">
          <CheckCircleOutline fontSize="large" color="success" />
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 600, color: "#059669" }}
          >
            Payment Successful!
          </Typography>
          <Typography variant="body1" paragraph>
            Your order has been placed and your payment has been processed
            successfully.
          </Typography>
          <Box
            sx={{
              bgcolor: "rgba(5, 150, 105, 0.08)",
              p: 2,
              borderRadius: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <ReceiptLongOutlined color="success" />
            <Typography variant="body2" color="text.secondary">
              A confirmation email with your order details will be sent to your
              email address.
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            You can now close this window if it opened as a popup, or use the
            button below to view your orders.
          </Typography>
          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleViewOrders}
              sx={{
                borderRadius: 2,
                boxShadow: "0 4px 8px rgba(37, 99, 235, 0.15)",
                px: 4,
                py: 1.5,
              }}
            >
              View Your Orders
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default PaymentSuccess;
