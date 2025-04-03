import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  Grid,
  TextField,
  Alert,
  Snackbar,
} from "@mui/material";
import { Add, Remove, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get(`/cart/${userId}`);
      setCartItems(response.data.items || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setSnackbar({
        open: true,
        message: "Error fetching cart items",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      await api.put(`/cart/${userId}/${itemId}`, { quantity });
      await fetchCart();
    } catch (error) {
      console.error("Error updating cart:", error);
      setSnackbar({
        open: true,
        message: "Error updating cart",
        severity: "error",
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await api.delete(`/cart/${userId}/${itemId}`);
      await fetchCart();
      setSnackbar({
        open: true,
        message: "Item removed from cart",
        severity: "success",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      setSnackbar({
        open: true,
        message: "Error removing item",
        severity: "error",
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleProceedToCheckout = () => {
    if (!deliveryAddress.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter a delivery address",
        severity: "error",
      });
      return;
    }
    navigate("/checkout", { state: { deliveryAddress } });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5">Loading cart...</Typography>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/restaurants")}
          sx={{
            mt: 2,
            borderRadius: 2,
            background: "linear-gradient(45deg, #1976d2, #2196f3)",
            "&:hover": {
              background: "linear-gradient(45deg, #1565c0, #1e88e5)",
            },
          }}
        >
          Browse Restaurants
        </Button>
      </Container>
    );
  }

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
        Your Cart
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
            }}
          >
            <List>
              {cartItems.map((item, index) => (
                <Box key={item.itemId}>
                  <ListItem>
                    <ListItemText
                      primary={item.name}
                      secondary={`$${item.price.toFixed(2)}`}
                    />
                    <ListItemSecondaryAction>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <IconButton
                          onClick={() =>
                            handleUpdateQuantity(item.itemId, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                          sx={{
                            borderRadius: 1,
                            "&:hover": {
                              background: "rgba(25, 118, 210, 0.1)",
                            },
                          }}
                        >
                          <Remove />
                        </IconButton>
                        <Typography>{item.quantity}</Typography>
                        <IconButton
                          onClick={() =>
                            handleUpdateQuantity(item.itemId, item.quantity + 1)
                          }
                          sx={{
                            borderRadius: 1,
                            "&:hover": {
                              background: "rgba(25, 118, 210, 0.1)",
                            },
                          }}
                        >
                          <Add />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRemoveItem(item.itemId)}
                          sx={{
                            borderRadius: 1,
                            "&:hover": {
                              background: "rgba(211, 47, 47, 0.1)",
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < cartItems.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                Subtotal: ${calculateTotal().toFixed(2)}
              </Typography>
              <Typography variant="body1">Delivery Fee: $5.00</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Total: ${(calculateTotal() + 5).toFixed(2)}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Delivery Address"
              variant="outlined"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleProceedToCheckout}
              sx={{
                borderRadius: 2,
                py: 1.5,
                background: "linear-gradient(45deg, #1976d2, #2196f3)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1565c0, #1e88e5)",
                },
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              Proceed to Checkout
            </Button>
          </Paper>
        </Grid>
      </Grid>

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

export default Cart;
