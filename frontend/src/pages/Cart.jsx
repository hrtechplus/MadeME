import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Paper,
  Box,
  Divider,
} from "@mui/material";
import { Add, Remove, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const navigate = useNavigate();
  const userId = "user123"; // Replace with actual user ID from auth

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

  const updateItemQuantity = async (itemId, quantity) => {
    try {
      await axios.put(`http://localhost:5003/api/cart/${userId}/${itemId}`, {
        quantity,
      });
      fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`http://localhost:5003/api/cart/${userId}/${itemId}`);
      fetchCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Cart
      </Typography>
      <Paper elevation={3} sx={{ p: 2 }}>
        {cart.items.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: "center", py: 4 }}>
            Your cart is empty
          </Typography>
        ) : (
          <>
            <List>
              {cart.items.map((item) => (
                <div key={item.itemId}>
                  <ListItem>
                    <ListItemText
                      primary={item.name}
                      secondary={`$${item.price.toFixed(2)}`}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        onClick={() =>
                          updateItemQuantity(item.itemId, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Remove />
                      </IconButton>
                      <Typography>{item.quantity}</Typography>
                      <IconButton
                        onClick={() =>
                          updateItemQuantity(item.itemId, item.quantity + 1)
                        }
                      >
                        <Add />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => removeItem(item.itemId)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                  <Divider />
                </div>
              ))}
            </List>
            <Box sx={{ mt: 2, p: 2, bgcolor: "background.default" }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Typography variant="subtitle1">
                Total: ${cart.total.toFixed(2)}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleCheckout}
                sx={{ mt: 2 }}
              >
                Proceed to Checkout
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}

export default Cart;
