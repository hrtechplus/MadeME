import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import PayPalButton from "../components/PayPalButton";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  Grid,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Alert,
  Fade,
} from "@mui/material";
import {
  AccountBalanceWallet,
  LocalAtm,
  CheckCircleOutline,
  PaymentOutlined,
  ShieldOutlined,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import "../styles/Payment.css";

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceUrls } = useApi();
  const { showToast } = useToast();
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [orderTotal, setOrderTotal] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const orderId = location.state?.orderId;
  const amount = location.state?.amount;

  useEffect(() => {
    if (!orderId || !amount) {
      setError("Invalid order details. Please try again.");
      showToast("Invalid order details", "error");
      navigate("/", { replace: true });
    } else {
      setOrderTotal(amount);

      // Store the amount in session storage for popup windows
      sessionStorage.setItem("paymentAmount", amount);
    }

    // Check if returning from PayPal
    const paymentSuccessParam = new URLSearchParams(window.location.search).get(
      "paymentStatus"
    );
    if (paymentSuccessParam === "success") {
      setPaymentStatus("success");
      showToast("Payment completed successfully!", "success");
    } else if (paymentSuccessParam === "cancel") {
      setPaymentStatus("cancelled");
      showToast("Payment was cancelled", "warning");
    }

    // Setup message listener for communication from PayPal popup window
    const handleMessage = (event) => {
      // Check origin to prevent XSS attacks
      if (event.origin !== window.location.origin) return;

      const { type, orderId, paymentId } = event.data;

      if (type === "PAYMENT_SUCCESS") {
        console.log("Payment success message received from popup", {
          orderId,
          paymentId,
        });
        handlePaymentSuccess();
      } else if (type === "PAYMENT_CANCELLED") {
        console.log("Payment cancelled message received from popup", {
          orderId,
        });
        handlePaymentCancel();
      }
    };

    // Add event listener
    window.addEventListener("message", handleMessage);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("message", handleMessage);

      // Clear polling interval if exists
      const intervalId = parseInt(
        sessionStorage.getItem("paymentPollInterval")
      );
      if (intervalId) {
        clearInterval(intervalId);
        sessionStorage.removeItem("paymentPollInterval");
      }
    };
  }, [orderId, amount, showToast, navigate]);

  const handleCashPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `${serviceUrls.payment}/api/payment/process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            orderId,
            amount,
            paymentMethod: "COD",
            userId: localStorage.getItem("userId"),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process cash payment");
      }

      // Just check response.ok, don't need to store data if not using it
      await response.json();

      showToast("Order placed successfully with Cash on Delivery!", "success");
      setPaymentStatus("success");

      setTimeout(() => {
        navigate("/orders", {
          state: {
            message: "Order placed successfully with Cash on Delivery!",
            orderId: orderId,
          },
        });
      }, 2000);
    } catch (err) {
      console.error("Cash payment error:", err);
      setError(err.message || "Error processing payment. Please try again.");
      showToast("Error processing payment", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentStatus("success");
    showToast("Payment completed successfully!", "success");

    // Navigate to the orders page after a brief delay
    setTimeout(() => {
      navigate("/orders", {
        state: {
          message: "Payment completed successfully!",
          orderId: orderId,
        },
      });
    }, 2000);
  };

  const handlePaymentError = (error) => {
    setError(error.message || "Payment failed. Please try again.");
    showToast("Payment failed", "error");
  };

  const handlePaymentCancel = () => {
    setPaymentStatus("cancelled");
    showToast("Payment was cancelled", "warning");
  };

  if (paymentStatus === "success") {
    return (
      <Container maxWidth="md" className="payment-container">
        <Paper elevation={3} className="payment-success">
          <CheckCircleOutline fontSize="large" color="success" />
          <Typography variant="h5" gutterBottom>
            Payment Successful!
          </Typography>
          <Typography variant="body1">
            Your order has been placed successfully.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/orders")}
            sx={{ mt: 3 }}
          >
            View Your Orders
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="payment-container">
      <Typography variant="h4" className="payment-page-title" gutterBottom>
        Complete Your Payment
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} className="payment-methods">
            <Typography variant="h6" gutterBottom>
              Choose Payment Method
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 3 }}>
              <Box
                className={`payment-option ${
                  paymentMethod === "paypal" ? "selected" : ""
                }`}
                onClick={() => setPaymentMethod("paypal")}
              >
                <div className="payment-option-icon paypal">
                  <AccountBalanceWallet />
                </div>
                <div className="payment-option-content">
                  <Typography className="payment-option-title">
                    Pay with PayPal
                  </Typography>
                  <Typography className="payment-option-description">
                    Fast, secure payment with your PayPal account or credit card
                  </Typography>
                </div>
                <Radio
                  checked={paymentMethod === "paypal"}
                  onChange={() => setPaymentMethod("paypal")}
                  value="paypal"
                  name="payment-method"
                  sx={{ ml: 2 }}
                />
              </Box>

              <Box
                className={`payment-option ${
                  paymentMethod === "cash" ? "selected" : ""
                }`}
                onClick={() => setPaymentMethod("cash")}
              >
                <div className="payment-option-icon cash">
                  <LocalAtm />
                </div>
                <div className="payment-option-content">
                  <Typography className="payment-option-title">
                    Cash on Delivery
                  </Typography>
                  <Typography className="payment-option-description">
                    Pay with cash when your order is delivered
                  </Typography>
                </div>
                <Radio
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                  value="cash"
                  name="payment-method"
                  sx={{ ml: 2 }}
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 2 }}>
              {paymentMethod === "paypal" ? (
                <Fade in={paymentMethod === "paypal"}>
                  <Box>
                    <Box
                      sx={{
                        mb: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <ShieldOutlined color="primary" />
                      <Typography variant="body2" color="text.secondary">
                        Your payment is secure and processed through PayPal.
                        You'll be redirected to PayPal to complete the payment.
                      </Typography>
                    </Box>
                    <PayPalButton
                      orderId={orderId}
                      amount={amount}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      onCancel={handlePaymentCancel}
                    />
                  </Box>
                </Fade>
              ) : (
                <Fade in={paymentMethod === "cash"}>
                  <Box>
                    <Box
                      sx={{
                        mb: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <ReceiptLongOutlined color="success" />
                      <Typography variant="body2" color="text.secondary">
                        Pay with cash upon delivery. Please have the exact
                        amount ready for our delivery person.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      className="cash-button"
                      onClick={handleCashPayment}
                      disabled={processing}
                      startIcon={processing ? null : <PaymentOutlined />}
                    >
                      {processing ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Place Order (Pay on Delivery)"
                      )}
                    </Button>
                  </Box>
                </Fade>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} className="order-summary">
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box
              className="order-detail"
              display="flex"
              justifyContent="space-between"
              mb={1}
            >
              <Typography variant="body1" color="text.secondary">
                Order ID
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {orderId?.substring(0, 8)}...
              </Typography>
            </Box>

            <Box
              className="order-detail"
              display="flex"
              justifyContent="space-between"
              mb={1}
            >
              <Typography variant="body1" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body1">${orderTotal.toFixed(2)}</Typography>
            </Box>

            <Box
              className="order-detail"
              display="flex"
              justifyContent="space-between"
              mb={1}
            >
              <Typography variant="body1" color="text.secondary">
                Delivery Fee
              </Typography>
              <Typography variant="body1">$0.00</Typography>
            </Box>

            <Box
              className="order-total"
              display="flex"
              justifyContent="space-between"
            >
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary.main">
                ${orderTotal.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Payment;
