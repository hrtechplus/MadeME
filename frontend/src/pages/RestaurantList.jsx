import { useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  TextField,
  Box,
  Chip,
  Rating,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Sample data - replace with actual API data
const restaurants = [
  {
    id: 1,
    name: "Pizza Palace",
    cuisine: "Italian",
    rating: 4.5,
    deliveryTime: "30-45",
    minOrder: 15,
    imageUrl: "https://source.unsplash.com/random/400x300/?pizza-restaurant",
    tags: ["Pizza", "Pasta", "Italian"],
  },
  {
    id: 2,
    name: "Sushi Master",
    cuisine: "Japanese",
    rating: 4.7,
    deliveryTime: "40-55",
    minOrder: 20,
    imageUrl: "https://source.unsplash.com/random/400x300/?sushi-restaurant",
    tags: ["Sushi", "Japanese", "Asian"],
  },
  {
    id: 3,
    name: "Burger Joint",
    cuisine: "American",
    rating: 4.3,
    deliveryTime: "25-35",
    minOrder: 10,
    imageUrl: "https://source.unsplash.com/random/400x300/?burger-restaurant",
    tags: ["Burgers", "American", "Fast Food"],
  },
  {
    id: 4,
    name: "Taco Fiesta",
    cuisine: "Mexican",
    rating: 4.6,
    deliveryTime: "35-50",
    minOrder: 12,
    imageUrl: "https://source.unsplash.com/random/400x300/?mexican-restaurant",
    tags: ["Mexican", "Tacos", "Latin"],
  },
  {
    id: 5,
    name: "Thai Spice",
    cuisine: "Thai",
    rating: 4.4,
    deliveryTime: "40-55",
    minOrder: 15,
    imageUrl: "https://source.unsplash.com/random/400x300/?thai-restaurant",
    tags: ["Thai", "Asian", "Spicy"],
  },
  {
    id: 6,
    name: "Indian Curry House",
    cuisine: "Indian",
    rating: 4.8,
    deliveryTime: "45-60",
    minOrder: 18,
    imageUrl: "https://source.unsplash.com/random/400x300/?indian-restaurant",
    tags: ["Indian", "Curry", "Vegetarian"],
  },
];

function RestaurantList() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredRestaurants = restaurants.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Restaurants
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by restaurant name, cuisine, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
      </Box>

      <Grid container spacing={4}>
        {filteredRestaurants.map((restaurant) => (
          <Grid item key={restaurant.id} xs={12} sm={6} md={4}>
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
                <Typography gutterBottom variant="h5" component="h2">
                  {restaurant.name}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Rating value={restaurant.rating} precision={0.1} readOnly />
                  <Typography variant="body2" color="text.secondary">
                    {restaurant.rating} stars
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {restaurant.cuisine} • {restaurant.deliveryTime} mins • $
                  {restaurant.minOrder} min
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {restaurant.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  View Menu
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredRestaurants.length === 0 && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No restaurants found matching your search
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default RestaurantList;
