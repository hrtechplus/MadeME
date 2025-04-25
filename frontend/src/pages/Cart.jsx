import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Add, Remove, Delete, ShoppingBag } from "@mui/icons-material";
import "../styles/Cart.css";

function Cart() {
  const navigate = useNavigate();
  const { serviceUrls } = useApi();
  const { showToast } = useToast();
  const {
    cart: cartItems,
    loading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error, showToast]);

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    updateQuantity(itemId, quantity);
  };

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
    showToast("Item removed from cart", "success");
  };

  const handleClearCart = () => {
    clearCart();
    showToast("Cart cleared", "success");
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          className="loading-container"
          sx={{ py: 8, display: "flex", justifyContent: "center" }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, bgcolor: "#fff5f5" }}>
          <Typography color="error" variant="h6" align="center" gutterBottom>
            Error Loading Cart
          </Typography>
          <Typography align="center" color="text.secondary">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={1} sx={{ p: 4, borderRadius: 2 }}>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Your Cart
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "#f9f9f9",
              py: 6,
              px: 4,
              borderRadius: 2,
              mt: 3,
            }}
          >
            <ShoppingBag sx={{ fontSize: 60, color: "#9e9e9e", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Your cart is empty
            </Typography>
            <Typography
              color="text.secondary"
              align="center"
              sx={{ mb: 4, maxWidth: 400 }}
            >
              Looks like you haven't added any items to your cart yet.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/restaurants")}
              sx={{ py: 1.5, px: 4 }}
            >
              Browse Restaurants
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ p: 4 }}>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, mb: 4 }}
          >
            Your Cart
          </Typography>

          <Box className="cart-items">
            {cartItems.map((item) => (
              <Paper
                key={item.itemId}
                elevation={0}
                sx={{
                  p: 3,
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #eaeaea",
                  borderRadius: 2,
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${item.price.toFixed(2)} each
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      mr: 2,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleUpdateQuantity(item.itemId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography
                      sx={{ px: 2, minWidth: "1.5rem", textAlign: "center" }}
                    >
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleUpdateQuantity(item.itemId, item.quantity + 1)
                      }
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      minWidth: "100px",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: "primary.main" }}
                    >
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveItem(item.itemId)}
                      sx={{ mt: 0.5 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleClearCart}
              sx={{
                px: 3,
                color: "#666",
                borderColor: "#e0e0e0",
                "&:hover": { borderColor: "#bdbdbd", bgcolor: "#f5f5f5" },
              }}
            >
              Clear Cart
            </Button>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Total: ${calculateTotal().toFixed(2)}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleCheckout}
                sx={{ px: 4, py: 1.5 }}
              >
                Proceed to Checkout
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default Cart;
