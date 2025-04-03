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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";

const stripePromise = loadStripe("your_publishable_key"); // Replace with your Stripe publishable key

const steps = ["Delivery Address", "Payment"];

function Checkout() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const navigate = useNavigate();
  const userId = "user123"; // Replace with actual user ID from auth

  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5003/api/cart/${userId}`
      );
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setActiveStep(1);
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create order
      const orderResponse = await axios.post(
        "http://localhost:5001/api/orders",
        {
          userId,
          restaurantId: cart.items[0]?.restaurantId,
          deliveryAddress: address,
        }
      );

      // Initialize payment
      const paymentResponse = await axios.post(
        "http://localhost:5002/api/payments/initiate",
        {
          orderId: orderResponse.data._id,
          amount: cart.total,
          userId,
          email: "user@example.com", // Replace with actual user email
        }
      );

      const stripe = await stripePromise;
      const { error } = await stripe.confirmCardPayment(
        paymentResponse.data.clientSecret,
        {
          payment_method: {
            card: elements.getElement("card"),
            billing_details: {
              name: "User Name", // Replace with actual user name
              email: "user@example.com", // Replace with actual user email
            },
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // Navigate to order tracking
      navigate(`/order/${orderResponse.data._id}`);
    } catch (error) {
      console.error("Error processing payment:", error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  const renderAddressForm = () => (
    <Box component="form" onSubmit={handleAddressSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Street Address"
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="City"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="State"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="ZIP Code"
            value={address.zipCode}
            onChange={(e) =>
              setAddress({ ...address, zipCode: e.target.value })
            }
          />
        </Grid>
      </Grid>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        sx={{ mt: 3 }}
      >
        Continue to Payment
      </Button>
    </Box>
  );

  const renderPaymentForm = () => (
    <Box sx={{ mt: 2 }}>
      {/* Add Stripe Elements here */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        onClick={handlePayment}
        disabled={loading}
        sx={{ mt: 3 }}
      >
        {loading ? <CircularProgress size={24} /> : "Pay Now"}
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Checkout
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {activeStep === 0 ? renderAddressForm() : renderPaymentForm()}
      </Paper>
    </Container>
  );
}

export default Checkout;
