import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

const stripePromise = loadStripe("your_publishable_key"); // Replace with your Stripe publishable key

// Create axios instance with default config
const api = axios.create({
  baseURL: "http://localhost:5003/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function Checkout() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [cart, setCart] = useState({ items: [], total: 0 });
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("userId");

  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    fetchCart();
    if (location.state?.deliveryAddress) {
      setAddress((prev) => ({
        ...prev,
        street: location.state.deliveryAddress,
      }));
    }
  }, [location.state]);

  const fetchCart = async () => {
    try {
      const response = await api.get(`/cart/${userId}`);
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const handleAddressSubmit = () => {
    if (
      !address.street ||
      !address.city ||
      !address.state ||
      !address.zipCode
    ) {
      setSnackbar({
        open: true,
        message: "Please fill in all address fields",
        severity: "error",
      });
      return;
    }
    setActiveStep(1);
  };

  const handlePaymentSubmit = async () => {
    if (
      !paymentDetails.cardNumber ||
      !paymentDetails.expiryDate ||
      !paymentDetails.cvv
    ) {
      setSnackbar({
        open: true,
        message: "Please fill in all payment details",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Create order
      const orderResponse = await api.post("http://localhost:5001/api/orders", {
        userId,
        items: [], // Will be populated from cart
        deliveryAddress: address,
        totalAmount: 0, // Will be calculated from cart
      });

      // Process payment
      await api.post("http://localhost:5002/api/payments", {
        orderId: orderResponse.data._id,
        amount: 0, // Will be calculated from cart
        paymentMethod: "card",
        paymentDetails,
      });

      setActiveStep(2);
    } catch (error) {
      console.error("Error processing payment:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error processing payment",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = () => {
    navigate("/orders");
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={address.street}
                onChange={(e) =>
                  setAddress({ ...address, street: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={address.city}
                onChange={(e) =>
                  setAddress({ ...address, city: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={address.state}
                onChange={(e) =>
                  setAddress({ ...address, state: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ZIP Code"
                value={address.zipCode}
                onChange={(e) =>
                  setAddress({ ...address, zipCode: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleAddressSubmit}
                sx={{
                  borderRadius: 2,
                  background: "linear-gradient(45deg, #1976d2, #2196f3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #1565c0, #1e88e5)",
                  },
                }}
              >
                Continue to Payment
              </Button>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                value={paymentDetails.cardNumber}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    cardNumber: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date (MM/YY)"
                value={paymentDetails.expiryDate}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    expiryDate: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CVV"
                value={paymentDetails.cvv}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    cvv: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handlePaymentSubmit}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  background: "linear-gradient(45deg, #1976d2, #2196f3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #1565c0, #1e88e5)",
                  },
                }}
              >
                {loading ? "Processing..." : "Complete Payment"}
              </Button>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" gutterBottom>
              Order Confirmed!
            </Typography>
            <Typography variant="body1" paragraph>
              Your order has been successfully placed and payment has been
              processed.
            </Typography>
            <Button
              variant="contained"
              onClick={handleCompleteOrder}
              sx={{
                borderRadius: 2,
                background: "linear-gradient(45deg, #1976d2, #2196f3)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1565c0, #1e88e5)",
                },
              }}
            >
              View Orders
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: "bold",
          background: "linear-gradient(45deg, #1976d2, #2196f3)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Checkout
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
        }}
      >
        <Stepper activeStep={activeStep} alternativeLabel>
          {["Delivery Address", "Payment", "Confirmation"].map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
        }}
      >
        {renderStepContent(activeStep)}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Checkout;
