import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Skeleton,
  Rating,
  CircularProgress,
  Paper,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";

function Home() {
  const navigate = useNavigate();
  const { serviceUrls, handleApiCall } = useApi();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const response = await handleApiCall(
          fetch(`${serviceUrls.restaurant}/api/restaurants`)
        );
        setRestaurants(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError("Failed to load restaurants. Please try again later.");
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [handleApiCall, serviceUrls.restaurant]);

  // Featured restaurants are the top 4 by rating
  const featuredRestaurants = restaurants
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "white",
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Food Delivery Made Easy
          </Typography>
          <Typography variant="h5" paragraph sx={{ mb: 4 }}>
            Order from your favorite restaurants and track your delivery in
            real-time
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate("/restaurants")}
          >
            Browse Restaurants
          </Button>
        </Container>
      </Box>

      {/* Featured Restaurants */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Featured Restaurants
        </Typography>

        {loading ? (
          <Grid container spacing={4}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item key={item} xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Skeleton
                    variant="rectangular"
                    height={200}
                    animation="wave"
                  />
                  <CardContent>
                    <Skeleton
                      variant="text"
                      height={30}
                      width="80%"
                      animation="wave"
                    />
                    <Skeleton
                      variant="text"
                      height={20}
                      width="50%"
                      animation="wave"
                    />
                    <Skeleton
                      variant="text"
                      height={20}
                      width="40%"
                      animation="wave"
                    />
                  </CardContent>
                  <CardActions>
                    <Skeleton
                      variant="rectangular"
                      height={30}
                      width={100}
                      animation="wave"
                    />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        ) : (
          <Grid container spacing={4}>
            {featuredRestaurants.map((restaurant) => (
              <Grid item key={restaurant._id} xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 12px 20px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={restaurant.imageUrl}
                    alt={restaurant.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="h2">
                      {restaurant.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {restaurant.cuisine}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Rating
                        value={restaurant.rating}
                        precision={0.5}
                        readOnly
                        size="small"
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        {restaurant.rating?.toFixed(1)}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                      sx={{ borderRadius: 1 }}
                    >
                      View Menu
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: "background.default", py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                🚀 Fast Delivery
              </Typography>
              <Typography>
                Get your food delivered quickly and efficiently
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                🍽️ Quality Restaurants
              </Typography>
              <Typography>
                Choose from a wide selection of top-rated restaurants
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                📱 Real-time Tracking
              </Typography>
              <Typography>
                Track your order status and delivery in real-time
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
