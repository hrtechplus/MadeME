import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
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
} from "@mui/icons-material";
import "../styles/Payment.css";

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [orderTotal, setOrderTotal] = useState(0);
  const [processing, setProcessing] = useState(false);

  const orderId = location.state?.orderId;
  const amount = location.state?.amount;

  useEffect(() => {
    if (!orderId || !amount) {
      setError("Invalid order details. Please try again.");
      showToast("Invalid order details", "error");
      navigate("/", { replace: true });
    } else {
      setOrderTotal(amount);
    }
  }, [orderId, amount, showToast, navigate]);

  const handlePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      let response;

      if (paymentMethod === "paypal") {
        // Use our dedicated PayPal payment handler
        return handlePayPalPayment();
      } else if (paymentMethod === "cash") {
        response = await handleApiCall(
          fetch(`${serviceUrls.payment}/api/payment/process`, {
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
          })
        );

        // For Cash on Delivery, consider both success and pending as valid states
        if (response.data.success || response.status === 200) {
          showToast(
            "Order placed successfully with Cash on Delivery!",
            "success"
          );
          setTimeout(() => {
            navigate("/orders", {
              state: {
                message: "Order placed successfully with Cash on Delivery!",
                orderId: response.data?.orderId || orderId,
              },
            });
          }, 2000);
        } else {
          setError(
            response.data.message ||
              "Order processing failed. Please try again."
          );
          showToast(response.data.message || "Failed to place order", "error");
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Error processing payment. Please try again.");
      showToast("Error processing payment", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Create a PayPal order
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
      console.log("PayPal order creation response:", data);

      if (!data || !data.orderId || !data.paymentId) {
        throw new Error("Failed to create PayPal order");
      }

      // Save order ID and payment ID to session storage for the return flow
      sessionStorage.setItem("currentOrderId", orderId);
      sessionStorage.setItem("paypalOrderId", data.orderId);
      sessionStorage.setItem("paymentId", data.paymentId);

      // Redirect to PayPal for payment approval
      window.location.href = `https://www.paypal.com/checkoutnow?token=${data.orderId}`;
    } catch (err) {
      console.error("PayPal payment error:", err);
      setError(
        err.message || "Error creating PayPal payment. Please try again."
      );
      showToast("Error setting up PayPal payment", "error");
      setProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: "paypal",
      name: "PayPal",
      icon: <AccountBalanceWallet sx={{ fontSize: 36, color: "#009cde" }} />,
    },
    {
      id: "cash",
      name: "Cash on Delivery",
      icon: <LocalAtm sx={{ fontSize: 36, color: "#38a169" }} />,
    },
  ];

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: 2, bgcolor: "#fff5f5" }}>
          <Typography color="error" variant="h6" align="center" gutterBottom>
            Payment Error
          </Typography>
          <Typography align="center" color="text.secondary">
            {error}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/cart")}
            >
              Return to Cart
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={1}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, mb: 3 }}
          >
            Complete Your Payment
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 4,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                py: 2,
                px: 4,
                bgcolor: "primary.50",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "primary.100",
              }}
            >
              <Typography
                variant="h6"
                align="center"
                sx={{ fontWeight: 500, color: "primary.main" }}
              >
                Order Total: ${orderTotal.toFixed(2)}
              </Typography>
            </Paper>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
            Select Payment Method
          </Typography>

          <FormControl component="fieldset" sx={{ width: "100%", mb: 4 }}>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <Grid container spacing={2}>
                {paymentMethods.map((method) => (
                  <Grid item xs={12} sm={4} key={method.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        border: "2px solid",
                        borderColor:
                          paymentMethod === method.id
                            ? "primary.main"
                            : "divider",
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        bgcolor:
                          paymentMethod === method.id
                            ? "primary.50"
                            : "background.paper",
                        "&:hover": {
                          borderColor:
                            paymentMethod === method.id
                              ? "primary.main"
                              : "primary.200",
                          bgcolor:
                            paymentMethod === method.id
                              ? "primary.50"
                              : "background.paper",
                        },
                      }}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <Box sx={{ mb: 2 }}>{method.icon}</Box>
                      <FormControlLabel
                        value={method.id}
                        control={
                          <Radio
                            sx={{
                              "&.Mui-checked": {
                                color: "primary.main",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {method.name}
                          </Typography>
                        }
                        sx={{
                          m: 0,
                          width: "100%",
                          justifyContent: "center",
                        }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          </FormControl>

          <Fade in={paymentMethod === "paypal"}>
            <Box
              sx={{
                mb: 4,
                display: paymentMethod === "paypal" ? "block" : "none",
              }}
            >
              <Alert
                severity="info"
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<CheckCircleOutline />}
              >
                You will be redirected to PayPal to complete your payment
                securely.
              </Alert>
            </Box>
          </Fade>

          <Fade in={paymentMethod === "cash"}>
            <Box
              sx={{
                mb: 4,
                display: paymentMethod === "cash" ? "block" : "none",
              }}
            >
              <Alert
                severity="info"
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<CheckCircleOutline />}
              >
                Pay with cash upon delivery. Have the exact amount ready for our
                delivery person.
              </Alert>
            </Box>
          </Fade>

          <Divider sx={{ my: 4 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate("/checkout")}
              sx={{ px: 3, color: "text.secondary" }}
            >
              Back to Checkout
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handlePayment}
              disabled={processing}
              sx={{ px: 5, py: 1.5 }}
            >
              {processing ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Processing...</span>
                </Box>
              ) : (
                `Pay ${orderTotal ? `$${orderTotal.toFixed(2)}` : ""}`
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default Payment;
