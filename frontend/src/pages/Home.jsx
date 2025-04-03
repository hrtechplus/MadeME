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
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Sample data - replace with actual API data
const featuredRestaurants = [
  {
    id: 1,
    name: "Pizza Palace",
    cuisine: "Italian",
    rating: 4.5,
    imageUrl: "https://source.unsplash.com/random/400x300/?pizza",
  },
  {
    id: 2,
    name: "Sushi Master",
    cuisine: "Japanese",
    rating: 4.7,
    imageUrl: "https://source.unsplash.com/random/400x300/?sushi",
  },
  {
    id: 3,
    name: "Burger Joint",
    cuisine: "American",
    rating: 4.3,
    imageUrl: "https://source.unsplash.com/random/400x300/?burger",
  },
  {
    id: 4,
    name: "Taco Fiesta",
    cuisine: "Mexican",
    rating: 4.6,
    imageUrl: "https://source.unsplash.com/random/400x300/?tacos",
  },
];

function Home() {
  const navigate = useNavigate();

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
        <Grid container spacing={4}>
          {featuredRestaurants.map((restaurant) => (
            <Grid item key={restaurant.id} xs={12} sm={6} md={3}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
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
                  <Typography>{restaurant.cuisine}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ⭐ {restaurant.rating}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  >
                    View Menu
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
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
