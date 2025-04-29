import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
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
  Stack,
} from "@mui/material";
import {
  CreditCard,
  AccountBalanceWallet,
  LocalAtm,
  LockOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import "../styles/Payment.css";

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
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

      if (paymentMethod === "credit_card") {
        // First get stripe client secret from the payment service
        const intentResponse = await handleApiCall(
          fetch(`${serviceUrls.payment}/api/payment/initiate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              orderId,
              amount,
              userId: localStorage.getItem("userId"),
              email: cardholderName.replace(/\s/g, "") + "@example.com", // Generate email from name for demo
            }),
          })
        );

        // Process the card payment
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
              paymentMethod: "CARD",
              cardDetails: {
                number: cardNumber,
                expiry: expiryDate,
                cvv: cvv,
                name: cardholderName,
              },
            }),
          })
        );

        // Handle successful card payment
        if (response.data.success || response.status === 200) {
          setSuccess(true);
          showToast("Order placed successfully!", "success");
          setTimeout(() => {
            navigate("/orders", {
              state: {
                message: "Order placed successfully!",
                orderId: response.data?.paymentId || orderId,
              },
            });
          }, 3000);
        } else {
          setError(
            response.data.message || "Payment failed. Please try again."
          );
          showToast(response.data.message || "Payment failed", "error");
        }
      } else if (paymentMethod === "paypal") {
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

        // Handle successful COD payment
        if (response.data.success || response.status === 200) {
          setSuccess(true);
          showToast("Order placed successfully!", "success");
          setTimeout(() => {
            navigate("/orders", {
              state: {
                message: "Order placed successfully!",
                orderId: response.data?.paymentId || orderId,
              },
            });
          }, 3000);
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
      console.log("Initiating PayPal payment process");

      // Detect platform - this could be expanded with more sophisticated detection
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const platform = isMobile ? "mobile" : "web";

      console.log(`Detected platform: ${platform}`);

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
            platform: platform,
          }),
        }
      );

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `HTTP error ${response.status}: ${response.statusText}`
        );
      }

      // Parse the JSON response
      const data = await response.json();
      console.log("PayPal order creation response:", data);

      if (!data || !data.success) {
        throw new Error(
          data?.message || data?.error || "Failed to create PayPal order"
        );
      }

      // Save order ID and PayPal order ID to session storage for the return flow
      sessionStorage.setItem("currentOrderId", orderId);
      sessionStorage.setItem("paypalOrderId", data.paypalOrderId);
      sessionStorage.setItem("paymentId", data.paymentId);

      // Check if we need to use mock PayPal flow
      const useMockPayPal = import.meta.env.VITE_PAYPAL_ENABLE_MOCK === "true";

      if (useMockPayPal && process.env.NODE_ENV !== "production") {
        console.log("Using mock PayPal flow for development");

        // Wait briefly to simulate redirect
        setTimeout(() => {
          // Directly go to success page with mock parameters
          navigate(
            `/payment/success?token=${data.paypalOrderId}&paymentId=${data.paymentId}`
          );
        }, 1500);

        return;
      }

      if (data.approvalUrl) {
        // Log success message and redirect URL
        console.log(
          "Successfully created PayPal order, redirecting to:",
          data.approvalUrl
        );

        // Add a small delay for better UX
        setTimeout(() => {
          // Redirect to PayPal for payment approval
          window.location.href = data.approvalUrl;
        }, 500);
      } else {
        throw new Error("PayPal approval URL not found in response");
      }
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
      id: "credit_card",
      name: "Credit Card",
      icon: <CreditCard sx={{ fontSize: 36, color: "#4a90e2" }} />,
    },
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, color: "text.secondary" }}>
          Preparing your payment...
        </Typography>
      </Container>
    );
  }

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

          <Fade in={paymentMethod === "credit_card"}>
            <Box
              sx={{
                mb: 4,
                display: paymentMethod === "credit_card" ? "block" : "none",
              }}
            >
              <Stack spacing={3}>
                <TextField
                  label="Card Number"
                  variant="outlined"
                  fullWidth
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <CreditCard color="action" sx={{ opacity: 0.6 }} />
                    ),
                  }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Expiration Date"
                      variant="outlined"
                      fullWidth
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="CVV"
                      variant="outlined"
                      fullWidth
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <LockOutlined color="action" sx={{ opacity: 0.6 }} />
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Cardholder Name"
                  variant="outlined"
                  fullWidth
                  placeholder="John Smith"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                />
              </Stack>
            </Box>
          </Fade>

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
