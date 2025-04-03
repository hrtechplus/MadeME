import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Rating,
  Snackbar,
  Alert,
  Divider,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { Add, Remove, ShoppingCart } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
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

// Sample data - replace with actual API data
const restaurant = {
  id: 1,
  name: "Pizza Palace",
  cuisine: "Italian",
  rating: 4.5,
  deliveryTime: "30-45",
  minOrder: 15,
  imageUrl: "https://source.unsplash.com/random/1200x400/?pizza-restaurant",
  description:
    "Authentic Italian pizzeria serving wood-fired pizzas and traditional pasta dishes.",
  address: "123 Main St, City, State 12345",
  tags: ["Pizza", "Pasta", "Italian"],
  menu: [
    {
      category: "Pizzas",
      items: [
        {
          id: "p1",
          name: "Margherita",
          description: "Fresh tomatoes, mozzarella, basil",
          price: 14.99,
          imageUrl:
            "https://source.unsplash.com/random/400x300/?margherita-pizza",
        },
        {
          id: "p2",
          name: "Pepperoni",
          description: "Classic pepperoni with mozzarella",
          price: 16.99,
          imageUrl:
            "https://source.unsplash.com/random/400x300/?pepperoni-pizza",
        },
      ],
    },
    {
      category: "Pasta",
      items: [
        {
          id: "pa1",
          name: "Spaghetti Carbonara",
          description: "Creamy sauce with pancetta and parmesan",
          price: 15.99,
          imageUrl: "https://source.unsplash.com/random/400x300/?carbonara",
        },
        {
          id: "pa2",
          name: "Fettuccine Alfredo",
          description: "Classic creamy alfredo sauce",
          price: 14.99,
          imageUrl: "https://source.unsplash.com/random/400x300/?pasta-alfredo",
        },
      ],
    },
  ],
};

function RestaurantDetail() {
  const [cart, setCart] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [activeStep, setActiveStep] = useState(0);
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get(`/cart/${userId}`);
      const cartItems = response.data.items || [];
      const cartMap = {};
      cartItems.forEach((item) => {
        cartMap[item.itemId] = item;
      });
      setCart(cartMap);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const handleAddToCart = async (item) => {
    try {
      await api.post(`/cart/${userId}`, {
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        restaurantId: restaurant.id,
      });

      await fetchCart();
      setSnackbar({
        open: true,
        message: "Item added to cart successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error adding item to cart",
        severity: "error",
      });
    }
  };

  const handleUpdateQuantity = async (item, quantity) => {
    try {
      await api.put(`/cart/${userId}/${item.id}`, {
        quantity,
      });

      await fetchCart();
      setSnackbar({
        open: true,
        message: "Cart updated successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating cart:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error updating cart",
        severity: "error",
      });
    }
  };

  const handleProceedToCheckout = () => {
    navigate("/checkout");
  };

  const steps = ["Select Items", "Review Cart", "Payment"];

  return (
    <Box>
      {/* Restaurant Header */}
      <Box
        sx={{
          position: "relative",
          height: "300px",
          backgroundImage: `url(${restaurant.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mb: 4,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            p: 3,
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="h3" gutterBottom>
              {restaurant.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
              <Rating value={restaurant.rating} precision={0.1} readOnly />
              <Typography>{restaurant.rating} stars</Typography>
            </Box>
            <Typography variant="subtitle1">
              {restaurant.cuisine} • {restaurant.deliveryTime} mins • $
              {restaurant.minOrder} min
            </Typography>
          </Container>
        </Box>
      </Box>

      <Container maxWidth="lg">
        {/* Progress Stepper */}
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
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Restaurant Info */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="body1" paragraph>
              {restaurant.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {restaurant.address}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              {restaurant.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  variant="outlined"
                  sx={{
                    borderRadius: 1,
                    borderColor: "primary.main",
                    color: "primary.main",
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Menu */}
        {restaurant.menu.map((category) => (
          <Box key={category.category} sx={{ mb: 6 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                fontWeight: "bold",
                background: "linear-gradient(45deg, #1976d2, #2196f3)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {category.category}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={4}>
              {category.items.map((item) => (
                <Grid item key={item.id} xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-4px)",
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.imageUrl}
                      alt={item.name}
                      sx={{ objectFit: "cover" }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                      >
                        {item.description}
                      </Typography>
                      <Typography
                        variant="h6"
                        color="primary"
                        sx={{ fontWeight: "bold" }}
                      >
                        ${item.price.toFixed(2)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {cart[item.id] ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          <IconButton
                            onClick={() =>
                              handleUpdateQuantity(
                                item,
                                cart[item.id].quantity - 1
                              )
                            }
                            disabled={cart[item.id].quantity <= 1}
                            sx={{
                              borderRadius: 1,
                              "&:hover": {
                                background: "rgba(25, 118, 210, 0.1)",
                              },
                            }}
                          >
                            <Remove />
                          </IconButton>
                          <Typography>{cart[item.id].quantity}</Typography>
                          <IconButton
                            onClick={() =>
                              handleUpdateQuantity(
                                item,
                                cart[item.id].quantity + 1
                              )
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
                        </Box>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => handleAddToCart(item)}
                          startIcon={<ShoppingCart />}
                          sx={{
                            borderRadius: 2,
                            background:
                              "linear-gradient(45deg, #1976d2, #2196f3)",
                            "&:hover": {
                              background:
                                "linear-gradient(45deg, #1565c0, #1e88e5)",
                            },
                          }}
                        >
                          Add to Cart
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        {/* Checkout Button */}
        {Object.keys(cart).length > 0 && (
          <Box
            sx={{
              position: "fixed",
              bottom: 20,
              right: 20,
              zIndex: 1000,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleProceedToCheckout}
              startIcon={<ShoppingCart />}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                background: "linear-gradient(45deg, #1976d2, #2196f3)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1565c0, #1e88e5)",
                },
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              }}
            >
              Proceed to Checkout ({Object.keys(cart).length} items)
            </Button>
          </Box>
        )}
      </Container>

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
    </Box>
  );
}

export default RestaurantDetail;
