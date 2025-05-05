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
  TextField,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  AccountBalanceWallet,
  LocalAtm,
  CheckCircleOutline,
  CreditCard,
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
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expMonth: "",
    expYear: "",
    cvc: "",
    type: "VISA",
  });

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
      } else if (paymentMethod === "card") {
        // Handle credit/debit card payment via PayPal gateway
        response = await handleApiCall(
          fetch(`${serviceUrls.payment}/api/payment/card/process`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              orderId,
              amount,
              userId: localStorage.getItem("userId"),
              email: localStorage.getItem("email"),
              cardDetails: {
                ...cardDetails,
                // Mask the card number for security in logs
                number: cardDetails.number.replace(/\d(?=\d{4})/g, "*"),
              },
            }),
          })
        );

        if (response.data.success) {
          showToast("Payment processed successfully!", "success");
          setTimeout(() => {
            navigate("/orders", {
              state: {
                message: "Your payment was successful!",
                orderId: response.data?.orderId || orderId,
              },
            });
          }, 2000);
        } else {
          setError(
            response.data.message ||
              "Payment processing failed. Please try again."
          );
          showToast(
            response.data.message || "Failed to process payment",
            "error"
          );
        }
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
            platform: "web",
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

      // Check for required fields based on the actual response structure
      if (!data) {
        throw new Error("No data received from PayPal order creation");
      }

      // The response has approvalUrl and paypalOrderId (as seen in the screenshot)
      const paypalOrderId = data.paypalOrderId || data.orderId;
      const approvalUrl = data.approvalUrl;
      const paymentId = data.paymentId;

      if (!approvalUrl) {
        throw new Error("No approval URL received from PayPal");
      }

      // Save order ID and payment ID to session storage for the return flow
      sessionStorage.setItem("currentOrderId", orderId);
      sessionStorage.setItem("paypalOrderId", paypalOrderId);
      sessionStorage.setItem("paymentId", paymentId);

      // Store the approval URL in session storage for reopening if needed
      sessionStorage.setItem("paypalCheckoutUrl", approvalUrl);

      // Attempt to open PayPal in a new tab with the approval URL
      openPayPalInNewTab(approvalUrl);
    } catch (err) {
      console.error("PayPal payment error:", err);
      setError(
        err.message || "Error creating PayPal payment. Please try again."
      );
      showToast("Error setting up PayPal payment", "error");
      setProcessing(false);
    }
  };

  // Separate function to handle opening PayPal in a new tab
  const openPayPalInNewTab = (url) => {
    // Try opening in a new tab with specific features for better compatibility
    const paypalWindow = window.open(
      url,
      "_blank",
      "noopener,noreferrer,resizable=yes,scrollbars=yes,status=yes,width=1000,height=700"
    );

    // If popup was blocked, fall back to other methods
    if (
      !paypalWindow ||
      paypalWindow.closed ||
      typeof paypalWindow.closed === "undefined"
    ) {
      console.warn("Popup may have been blocked");
      showToast("Popup blocked! Trying alternative methods...", "warning");

      // Try to create a button that will trigger the popup when clicked
      // This works better because it's user-initiated
      const popupButton = document.createElement("a");
      popupButton.href = url;
      popupButton.target = "_blank";
      popupButton.rel = "noopener noreferrer";
      popupButton.style.display = "none";
      document.body.appendChild(popupButton);

      // Simulate a click
      popupButton.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(popupButton);

        // Check if the window was actually opened
        if (!window.open("", "_blank") || window.open("", "_blank").closed) {
          // If still blocked, offer a direct link
          setError(
            "We couldn't open PayPal automatically. Please click the button below to open PayPal checkout in a new tab."
          );
          setProcessing(false);
        } else {
          // Window seems to have opened successfully
          setProcessing(false);
          showToast("PayPal checkout opened in a new tab", "info");
          startPaymentStatusPolling(sessionStorage.getItem("paymentId"));
        }
      }, 1000);
    } else {
      // Window opened successfully
      setProcessing(false);
      showToast("PayPal checkout opened in a new tab", "info");
      startPaymentStatusPolling(sessionStorage.getItem("paymentId"));
    }
  };

  // Add a new function to poll for payment status updates
  const startPaymentStatusPolling = (paymentId) => {
    if (!paymentId) {
      console.error("No payment ID provided for polling");
      return;
    }

    console.log("Starting payment status polling for ID:", paymentId);

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
          console.warn("Payment status polling error:", response.statusText);
          return;
        }

        const data = await response.json();
        console.log("Payment status poll result:", data);

        // Extract payment status, accounting for different response formats
        const paymentStatus =
          data.status ||
          (data.payment && data.payment.status) ||
          (data.data && data.data.status);

        // If payment is completed, redirect to success page
        if (paymentStatus === "COMPLETED") {
          clearInterval(pollInterval);
          showToast("Payment completed successfully!", "success");
          navigate("/payment/success", {
            state: {
              orderId,
              paymentId,
            },
          });
        }
        // If payment is failed, show error
        else if (paymentStatus === "FAILED") {
          clearInterval(pollInterval);
          setError("Payment failed. Please try again.");
          showToast("Payment failed", "error");
        }
        // Otherwise continue polling
      } catch (err) {
        console.error("Error checking payment status:", err);
      }
    }, 3000); // Check every 3 seconds

    // Clear interval when component unmounts
    return () => clearInterval(pollInterval);
  };

  const handleCardDetailsChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <CreditCard sx={{ fontSize: 36, color: "#6772e5" }} />,
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

  if (error && sessionStorage.getItem("paypalCheckoutUrl")) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: 2, bgcolor: "#fff5f5" }}>
          <Typography color="error" variant="h6" align="center" gutterBottom>
            Payment Error
          </Typography>
          <Typography align="center" color="text.secondary" gutterBottom>
            {error}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 3,
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                window.open(
                  sessionStorage.getItem("paypalCheckoutUrl"),
                  "_blank"
                )
              }
            >
              Open PayPal Checkout
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate("/cart")}
            >
              Return to Cart
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  } else if (error) {
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

          <Fade in={paymentMethod === "card"}>
            <Box
              sx={{
                mb: 4,
                display: paymentMethod === "card" ? "block" : "none",
              }}
            >
              <Alert
                severity="info"
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<CreditCard />}
              >
                Your card details are securely processed through PayPal. We
                don't store your card information.
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Card Number"
                    variant="outlined"
                    name="number"
                    value={cardDetails.number}
                    onChange={handleCardDetailsChange}
                    placeholder="1234 5678 9012 3456"
                    inputProps={{ maxLength: 19 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Exp. Month"
                    variant="outlined"
                    name="expMonth"
                    value={cardDetails.expMonth}
                    onChange={handleCardDetailsChange}
                    placeholder="MM"
                    inputProps={{ maxLength: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Exp. Year"
                    variant="outlined"
                    name="expYear"
                    value={cardDetails.expYear}
                    onChange={handleCardDetailsChange}
                    placeholder="YYYY"
                    inputProps={{ maxLength: 4 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="CVC"
                    variant="outlined"
                    name="cvc"
                    value={cardDetails.cvc}
                    onChange={handleCardDetailsChange}
                    placeholder="123"
                    inputProps={{ maxLength: 4 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="card-type-label">Card Type</InputLabel>
                    <Select
                      labelId="card-type-label"
                      name="type"
                      value={cardDetails.type}
                      onChange={handleCardDetailsChange}
                      label="Card Type"
                    >
                      <MenuItem value="VISA">Visa</MenuItem>
                      <MenuItem value="MASTERCARD">Mastercard</MenuItem>
                      <MenuItem value="AMEX">American Express</MenuItem>
                      <MenuItem value="DISCOVER">Discover</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
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
                PayPal checkout will open in a new tab. Please complete your
                payment there and return to this page.
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
