import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { mockRestaurants } from "../data/mockRestaurants";
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
  Paper,
  Divider,
  IconButton,
  Badge,
  Chip,
  CircularProgress,
  Alert,
  Skeleton,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add,
  Remove,
  DeleteOutline,
  ShoppingCartOutlined,
  RestaurantOutlined,
  DeliveryDining,
  Star,
  ArrowBack,
} from "@mui/icons-material";
import "../styles/RestaurantMenu.css";

function RestaurantMenu() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    cart,  // Changed from cartItems to cart to match CartContext
    addToCart,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
  } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        console.log("Looking for restaurant with ID:", restaurantId);

        // For now, use mock data
        let foundRestaurant = mockRestaurants.find(
          (r) => r._id === restaurantId
        );

        // If not found by exact match, try to find by partial match
        if (!foundRestaurant) {
          // Log all available restaurant IDs for debugging
          console.log(
            "Available restaurant IDs:",
            mockRestaurants.map((r) => r._id)
          );

          // If not found, just use the first restaurant for demo purposes
          foundRestaurant = mockRestaurants[0];
          console.log("Defaulting to first restaurant:", foundRestaurant.name);
        }

        setRestaurant(foundRestaurant);
        setLoading(false);
      } catch (err) {
        console.error("Error loading restaurant:", err);
        setError("Failed to load restaurant menu. Please try again later.");
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  // Handle adding item to cart
  const handleAddToCart = async (item) => {
    try {
      // Create an item with all required fields for the cart API
      const cartItem = {
        itemId: item._id || item.id, // Use _id or id, whichever is available
        name: item.name,
        price: item.price,
        quantity: 1,
        restaurantId: restaurantId,
      };

      console.log("Attempting to add item to cart:", cartItem);

      // Pass the properly formatted item to the addToCart function
      const success = await addToCart(cartItem);

      if (success) {
        showToast("Item added to cart!", "success");
      } else {
        showToast("Failed to add item to cart. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      showToast("Failed to add item to cart. Please try again.", "error");
    }
  };

  // Handle updating item quantity
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  // Handle removing item from cart
  const handleRemoveFromCart = (itemId) => {
    removeFromCart(itemId);
  };

  // Handle checkout
  const handleCheckout = () => {
    navigate("/checkout");
  };

  // Move theme hooks outside of conditional rendering to ensure consistent hooks order
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ width: "100%" }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="30%" height={20} />
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Skeleton
                variant="rectangular"
                height={60}
                width="100%"
                sx={{ borderRadius: 2, mb: 3 }}
              />

              <Grid container spacing={2}>
                {Array.from(new Array(6)).map((_, index) => (
                  <Grid item key={index} xs={12} sm={6} md={4}>
                    <Card sx={{ height: "100%" }}>
                      <Skeleton variant="rectangular" height={140} />
                      <CardContent>
                        <Skeleton variant="text" height={30} width="70%" />
                        <Skeleton variant="text" height={20} width="40%" />
                        <Skeleton variant="text" height={20} width="60%" />
                      </CardContent>
                      <CardActions>
                        <Skeleton
                          variant="rectangular"
                          height={36}
                          width="100%"
                        />
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton
              variant="rectangular"
              height={400}
              width="100%"
              sx={{ borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={1}
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "#fff5f5",
            borderRadius: 2,
          }}
        >
          <Typography color="error" variant="h6" gutterBottom>
            Error Loading Restaurant
          </Typography>
          <Typography color="text.secondary">{error}</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/restaurants")}
            sx={{ mt: 3 }}
          >
            Back to Restaurants
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!restaurant) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper
          elevation={1}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <RestaurantOutlined
            sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Restaurant Not Found
          </Typography>
          <Typography color="text.secondary" paragraph>
            The restaurant you're looking for doesn't exist or may have been
            removed.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/restaurants")}
          >
            Browse Restaurants
          </Button>
        </Paper>
      </Container>
    );
  }

  // Group menu items by category
  // Since mock data doesn't have categories, we'll use a default category
  const groupedItems = restaurant.menu.reduce((groups, item) => {
    const category = item.category || "Menu Items";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  const calculateCartTotal = () => {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/restaurants")}
        sx={{ mb: 3 }}
      >
        Back to Restaurants
      </Button>

      <Paper
        elevation={1}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${restaurant.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          position: "relative",
        }}
      >
        <Box sx={{ maxWidth: "60%" }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            {restaurant.name}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mb: 1,
            }}
          >
            <Chip
              icon={<RestaurantOutlined sx={{ color: "white !important" }} />}
              label={restaurant.cuisine}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "& .MuiChip-icon": { color: "white" },
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Star sx={{ color: "#FFD700", mr: 0.5 }} />
              <Typography
                variant="body2"
                component="span"
                sx={{ fontWeight: 500 }}
              >
                {restaurant.rating?.toFixed(1) || "4.5"} •{" "}
                {restaurant.reviewCount || "200+"} reviews
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <DeliveryDining sx={{ mr: 0.5 }} />
              <Typography
                variant="body2"
                component="span"
                sx={{ fontWeight: 500 }}
              >
                30-45 min
              </Typography>
            </Box>
          </Box>

          <Typography variant="body1" sx={{ mt: 2, maxWidth: "80%" }}>
            {restaurant.description ||
              "Enjoy our delicious selection of dishes, made with fresh ingredients and love."}
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {Object.entries(groupedItems).map(([category, items]) => (
            <Box key={category} sx={{ mb: 5 }}>
              <Typography
                variant="h5"
                component="h2"
                id={`category-${category.toLowerCase().replace(/\s+/g, "-")}`}
                sx={{
                  fontWeight: 600,
                  mb: 3,
                  pb: 1,
                  borderBottom: "2px solid",
                  borderColor: "primary.main",
                  display: "inline-block",
                }}
              >
                {category}
              </Typography>

              <Grid container spacing={2}>
                {items.map((item) => (
                  <Grid item key={item._id} xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                        },
                        borderRadius: 2,
                      }}
                    >
                      {item.imageUrl && (
                        <CardMedia
                          component="img"
                          height={140}
                          image={item.imageUrl}
                          alt={item.name}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                        <Typography
                          variant="h6"
                          component="h3"
                          gutterBottom
                          sx={{ fontWeight: 600 }}
                        >
                          {item.name}
                        </Typography>
                        {item.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            paragraph
                            sx={{ mb: 2 }}
                          >
                            {item.description}
                          </Typography>
                        )}
                        <Typography
                          variant="subtitle1"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        >
                          ${item.price.toFixed(2)}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          size="medium"
                          startIcon={<Add />}
                          onClick={() => handleAddToCart(item)}
                          sx={{ borderRadius: 1.5 }}
                        >
                          Add to Cart
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ position: { md: "sticky" }, top: 100 }}>
            <Paper
              elevation={1}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 600, display: "flex", alignItems: "center" }}
              >
                <ShoppingCartOutlined sx={{ mr: 1 }} />
                Your Order
              </Typography>

              <Divider sx={{ my: 2 }} />

              {!cart || cart.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <ShoppingCartOutlined
                    sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                  />
                  <Typography color="text.secondary" paragraph>
                    Your cart is empty
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add items from the menu to get started
                  </Typography>
                </Box>
              ) : (
                <>
                  <Stack
                    spacing={2}
                    sx={{ maxHeight: 320, overflowY: "auto", pr: 1, mb: 3 }}
                  >
                    {cart.map((item) => (
                      <Paper
                        key={item.itemId}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 1.5,
                          bgcolor: "background.paper",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 500 }}
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            ${(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.itemId,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                              sx={{
                                bgcolor: "action.hover",
                                "&:hover": { bgcolor: "action.selected" },
                              }}
                            >
                              <Remove fontSize="small" />
                            </IconButton>

                            <Typography
                              sx={{
                                mx: 1,
                                fontWeight: 500,
                                minWidth: 24,
                                textAlign: "center",
                              }}
                            >
                              {item.quantity}
                            </Typography>

                            <IconButton
                              size="small"
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.itemId,
                                  item.quantity + 1
                                )
                              }
                              sx={{
                                bgcolor: "action.hover",
                                "&:hover": { bgcolor: "action.selected" },
                              }}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Box>

                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFromCart(item.itemId)}
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body1">Subtotal</Typography>
                      <Typography variant="body1">
                        ${calculateCartTotal().toFixed(2)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Delivery Fee
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        $2.99
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Tax
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${(calculateCartTotal() * 0.08).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      $$
                      {(
                        calculateCartTotal() +
                        2.99 +
                        calculateCartTotal() * 0.08
                      ).toFixed(2)}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    onClick={handleCheckout}
                    sx={{ py: 1.5, borderRadius: 1.5 }}
                  >
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default RestaurantMenu;
