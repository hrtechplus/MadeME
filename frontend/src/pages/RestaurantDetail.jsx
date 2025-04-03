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
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add,
  Remove,
  ShoppingCart,
  Favorite,
  Share,
  Star,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Update API configuration
const api = axios.create({
  baseURL: "http://localhost:5003/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000, // Add timeout
});

// Spoonacular API configuration
const SPOONACULAR_API_KEY = "YOUR_SPOONACULAR_API_KEY"; // Replace with your API key
const spoonacularApi = axios.create({
  baseURL: "https://api.spoonacular.com",
  params: {
    apiKey: SPOONACULAR_API_KEY,
  },
});

function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchRestaurantData();
    fetchCart();
  }, [id]);

  // Add request interceptor to add auth token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === "ECONNREFUSED") {
          setSnackbar({
            open: true,
            message: "Unable to connect to the server. Please try again later.",
            severity: "error",
          });
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on component unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      // For development, use mock data if API is not available
      const mockRestaurant = {
        id: id,
        name: "Sample Restaurant",
        cuisine: "Italian",
        rating: 4.5,
        deliveryTime: "30-45",
        minOrder: 15,
        image: "https://source.unsplash.com/random/1200x400/?restaurant",
        description: "A sample restaurant description.",
        address: "123 Main St, City, State 12345",
      };

      const mockMenu = [
        {
          title: "Appetizers",
          items: [
            {
              id: "1",
              title: "Bruschetta",
              description:
                "Toasted bread topped with tomatoes, garlic, and basil",
              price: 8.99,
              image: "https://source.unsplash.com/random/400x300/?bruschetta",
              rating: 4.5,
              reviewCount: 120,
            },
            {
              id: "2",
              title: "Calamari",
              description: "Crispy fried squid with marinara sauce",
              price: 12.99,
              image: "https://source.unsplash.com/random/400x300/?calamari",
              rating: 4.2,
              reviewCount: 85,
            },
          ],
        },
        {
          title: "Main Courses",
          items: [
            {
              id: "3",
              title: "Margherita Pizza",
              description:
                "Classic pizza with tomato sauce, mozzarella, and basil",
              price: 14.99,
              image: "https://source.unsplash.com/random/400x300/?pizza",
              rating: 4.7,
              reviewCount: 230,
            },
            {
              id: "4",
              title: "Spaghetti Carbonara",
              description: "Pasta with creamy sauce, pancetta, and parmesan",
              price: 16.99,
              image: "https://source.unsplash.com/random/400x300/?carbonara",
              rating: 4.6,
              reviewCount: 180,
            },
          ],
        },
      ];

      // Try to fetch from API first
      try {
        const [restaurantResponse, menuResponse] = await Promise.all([
          spoonacularApi.get(`/food/restaurants/${id}`),
          spoonacularApi.get(`/food/menuItems/search`, {
            params: {
              restaurantId: id,
              number: 20,
            },
          }),
        ]);

        setRestaurant(restaurantResponse.data);
        setMenu(menuResponse.data.menuItems);
      } catch (apiError) {
        console.warn("Using mock data due to API error:", apiError);
        setRestaurant(mockRestaurant);
        setMenu(mockMenu);
      }
    } catch (error) {
      console.error("Error fetching restaurant data:", error);
      setError("Failed to load restaurant data");
    } finally {
      setLoading(false);
    }
  };

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
      // Initialize empty cart if API is not available
      setCart({});
    }
  };

  const handleAddToCart = async (item) => {
    try {
      await api.post(`/cart/${userId}`, {
        itemId: item.id,
        name: item.title,
        price: item.price,
        quantity: 1,
        restaurantId: id,
        image: item.image,
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !restaurant) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          {error || "Restaurant not found"}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/restaurants")}
          sx={{ mt: 2 }}
        >
          Back to Restaurants
        </Button>
      </Container>
    );
  }

  return (
    <Box>
      {/* Restaurant Header */}
      <Box
        sx={{
          position: "relative",
          height: "400px",
          backgroundImage: `url(${restaurant.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mb: 4,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
          },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              position: "relative",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              color: "white",
              pb: 4,
            }}
          >
            <Typography variant="h2" gutterBottom sx={{ fontWeight: "bold" }}>
              {restaurant.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Rating value={restaurant.rating} precision={0.1} readOnly />
              <Typography variant="h6">{restaurant.rating} stars</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Chip
                label={restaurant.cuisine}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
              <Chip
                label={`${restaurant.deliveryTime} mins`}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
              <Chip
                label={`$${restaurant.minOrder} min`}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Favorite />}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                Save
              </Button>
              <Button
                variant="contained"
                startIcon={<Share />}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                  },
                }}
              >
                Share
              </Button>
            </Box>
          </Box>
        </Container>
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
          <Stepper activeStep={0} alternativeLabel>
            {["Select Items", "Review Cart", "Payment"].map((label) => (
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

        {/* Menu Tabs */}
        <Paper
          elevation={3}
          sx={{
            mb: 4,
            borderRadius: 2,
            background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                fontWeight: "bold",
                textTransform: "none",
                fontSize: "1.1rem",
              },
            }}
          >
            {menu.map((category, index) => (
              <Tab key={index} label={category.title} />
            ))}
          </Tabs>
        </Paper>

        {/* Menu Items */}
        <Grid container spacing={4}>
          {menu[activeTab]?.items?.map((item) => (
            <Grid key={item.id} xs={12} sm={6} md={4}>
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
                  image={item.image}
                  alt={item.title}
                  sx={{ objectFit: "cover" }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {item.description}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Star color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      {item.rating} ({item.reviewCount} reviews)
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{ fontWeight: "bold", mt: 1 }}
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
                          handleUpdateQuantity(item, cart[item.id].quantity - 1)
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
                          handleUpdateQuantity(item, cart[item.id].quantity + 1)
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
                        background: "linear-gradient(45deg, #1976d2, #2196f3)",
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
