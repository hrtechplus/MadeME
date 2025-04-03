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

const mockRestaurant = {
  id: 1,
  name: "Italian Bistro",
  cuisine: "Italian",
  rating: 4.5,
  deliveryTime: "30-45",
  minOrder: 15,
  image: "https://source.unsplash.com/random/1200x400/?italian-restaurant",
  description:
    "Authentic Italian cuisine with a modern twist. Our chefs use only the finest ingredients to create memorable dining experiences.",
  address: "123 Main St, City, State 12345",
};

const mockMenu = [
  {
    title: "Appetizers",
    items: [
      {
        id: "1",
        title: "Bruschetta",
        description: "Toasted bread topped with tomatoes, garlic, and basil",
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
        description: "Classic pizza with tomato sauce, mozzarella, and basil",
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

function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(mockRestaurant);
  const [menu, setMenu] = useState(mockMenu);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    // For development, use mock data
    setRestaurant(mockRestaurant);
    setMenu(mockMenu);
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
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      await api.post("/cart/add", {
        userId,
        itemId: item.id,
        quantity: 1,
        price: item.price,
      });

      setCart((prev) => ({
        ...prev,
        [item.id]: {
          itemId: item.id,
          quantity: 1,
          price: item.price,
        },
      }));

      setSnackbar({
        open: true,
        message: "Item added to cart!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      setSnackbar({
        open: true,
        message: "Failed to add item to cart. Please try again.",
        severity: "error",
      });
    }
  };

  const handleProceedToCheckout = () => {
    navigate("/cart");
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* Restaurant Header */}
          <Box
            sx={{
              position: "relative",
              height: 300,
              mb: 4,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src={restaurant.image}
              alt={restaurant.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                p: 4,
                color: "white",
              }}
            >
              <Typography
                variant="h3"
                component="h1"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                {restaurant.name}
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {restaurant.cuisine} • ⭐ {restaurant.rating} •{" "}
                {restaurant.deliveryTime} min
              </Typography>
              <Typography>{restaurant.description}</Typography>
            </Box>
          </Box>

          {/* Menu Section */}
          <Box sx={{ mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 3 }}
            >
              {menu.map((category, index) => (
                <Tab
                  key={index}
                  label={category.title}
                  sx={{
                    textTransform: "none",
                    fontWeight: "bold",
                    minWidth: "auto",
                    px: 3,
                  }}
                />
              ))}
            </Tabs>

            <Grid container spacing={3}>
              {menu[activeTab]?.items.map((item) => (
                <Grid key={item.id} xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: "scale(1.02)",
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.image}
                      alt={item.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2">
                        {item.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {item.description}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="h6" color="primary">
                          ${item.price.toFixed(2)}
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={() => handleAddToCart(item)}
                          disabled={loading}
                        >
                          Add to Cart
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

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
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  background: "linear-gradient(45deg, #1976d2, #2196f3)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #1565c0, #1e88e5)",
                  },
                }}
              >
                Proceed to Checkout ({Object.keys(cart).length} items)
              </Button>
            </Box>
          )}
        </>
      )}

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

export default RestaurantDetail;
