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

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNREFUSED") {
      console.warn("Cart service unavailable, using local storage");
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

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

  const fetchCart = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      // Try to fetch from API first
      try {
        const response = await api.get(`/cart/${userId}`);
        const cartItems = response.data.items || [];
        const cartMap = {};
        cartItems.forEach((item) => {
          cartMap[item.itemId] = item;
        });
        setCart(cartMap);
      } catch (error) {
        // If API fails, try to get from local storage
        const localCart = localStorage.getItem(`cart_${userId}`);
        if (localCart) {
          setCart(JSON.parse(localCart));
        }
      }
    } catch (error) {
      console.warn("Error fetching cart:", error);
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

      // Try to add to API first
      try {
        await api.post("/cart/add", {
          userId,
          itemId: item.id,
          quantity: 1,
          price: item.price,
        });
      } catch (error) {
        // If API fails, use local storage
        const localCart = localStorage.getItem(`cart_${userId}`);
        const cartItems = localCart ? JSON.parse(localCart) : {};
        cartItems[item.id] = {
          itemId: item.id,
          quantity: 1,
          price: item.price,
          name: item.title,
        };
        localStorage.setItem(`cart_${userId}`, JSON.stringify(cartItems));
      }

      setCart((prev) => ({
        ...prev,
        [item.id]: {
          itemId: item.id,
          quantity: 1,
          price: item.price,
          name: item.title,
        },
      }));

      setSnackbar({
        open: true,
        message: "Item added to cart!",
        severity: "success",
      });
    } catch (error) {
      console.warn("Error adding to cart:", error);
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
      {/* Restaurant Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardMedia
                component="img"
                height="400"
                image={restaurant.image}
                alt={restaurant.name}
              />
              <CardContent>
                <Typography variant="h4" gutterBottom>
                  {restaurant.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {restaurant.description}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <Chip label={restaurant.cuisine} />
                  <Chip label={`⭐ ${restaurant.rating}`} />
                  <Chip label={`${restaurant.deliveryTime} min`} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {restaurant.address}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                {Object.keys(cart).length > 0 ? (
                  <>
                    {Object.values(cart).map((item) => (
                      <Box key={item.itemId} sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          {item.quantity}x {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleProceedToCheckout}
                    >
                      Proceed to Checkout
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Your cart is empty
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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
            <Grid item xs={12} sm={6} md={4} key={item.id}>
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default RestaurantDetail;
