import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
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
  Skeleton,
  Rating,
  Chip,
  Paper,
  InputBase,
  IconButton,
  Divider,
} from "@mui/material";
import { Search, FilterList, LocalDining } from "@mui/icons-material";
import "../styles/RestaurantList.css";

function RestaurantList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { api } = useApi();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get("/restaurants");
        setRestaurants(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load restaurants. Please try again later.");
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [api]);

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearchTerm = restaurant.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCuisine =
      selectedCuisine === "" || restaurant.cuisine === selectedCuisine;
    return matchesSearchTerm && matchesCuisine;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          mb={4}
          sx={{ fontWeight: 600 }}
        >
          Restaurants
        </Typography>
        <Grid container spacing={3}>
          {Array.from(new Array(6)).map((_, index) => (
            <Grid item key={index} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Skeleton variant="rectangular" height={200} animation="wave" />
                <CardContent>
                  <Skeleton width="60%" height={30} animation="wave" />
                  <Skeleton width="40%" height={20} animation="wave" />
                  <Skeleton width="30%" height={20} animation="wave" />
                </CardContent>
                <CardActions sx={{ mt: "auto", px: 2, pb: 2 }}>
                  <Skeleton width={120} height={36} animation="wave" />
                </CardActions>
              </Card>
            </Grid>
          ))}
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
            Error Loading Restaurants
          </Typography>
          <Typography color="text.secondary">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  if (restaurants.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          mb={4}
          sx={{ fontWeight: 600 }}
        >
          Restaurants
        </Typography>
        <Paper
          elevation={1}
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <LocalDining sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No restaurants found
          </Typography>
          <Typography color="text.secondary">
            We couldn't find any restaurants at the moment. Please try again
            later.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        mb={2}
        sx={{ fontWeight: 600 }}
      >
        Restaurants
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Paper
          component="form"
          sx={{
            p: "2px 4px",
            display: "flex",
            alignItems: "center",
            borderRadius: 2,
            maxWidth: 600,
            mb: 3,
          }}
        >
          <IconButton sx={{ p: "10px" }} aria-label="menu">
            <FilterList />
          </IconButton>
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder="Search restaurants or cuisines"
            inputProps={{ "aria-label": "search restaurants" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <IconButton type="button" sx={{ p: "10px" }} aria-label="search">
            <Search />
          </IconButton>
        </Paper>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {["All", "Italian", "Japanese", "Mexican", "American", "Indian"].map(
            (cuisine) => (
              <Chip
                key={cuisine}
                label={cuisine}
                clickable
                color={selectedCuisine === cuisine ? "primary" : "default"}
                onClick={() =>
                  setSelectedCuisine(cuisine === "All" ? "" : cuisine)
                }
                sx={{ m: 0.5 }}
              />
            )
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredRestaurants.map((restaurant) => (
          <Grid item key={restaurant.id} xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 12px 20px rgba(0,0,0,0.1)",
                },
              }}
            >
              <CardMedia
                component="img"
                height={200}
                image={restaurant.imageUrl}
                alt={restaurant.name}
                sx={{ objectFit: "cover" }}
              />
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography
                  variant="h5"
                  component="h2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  {restaurant.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {restaurant.cuisine}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
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
                    {restaurant.rating.toFixed(1)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {restaurant.address || "123 Main St, City, State"}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions sx={{ p: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                  sx={{
                    borderRadius: 1,
                    py: 1,
                  }}
                >
                  View Menu
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default RestaurantList;
