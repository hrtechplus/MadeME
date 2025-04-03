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
  Box,
  Chip,
  Rating,
  Snackbar,
  Alert,
  Divider,
  IconButton,
  Paper,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

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
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = "user123"; // Replace with actual user ID from auth

  const handleAddToCart = async (item) => {
    try {
      await axios.post(`http://localhost:5003/api/cart/${userId}`, {
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        restaurantId: restaurant.id,
      });

      setSnackbar({
        open: true,
        message: "Item added to cart successfully!",
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      setSnackbar({
        open: true,
        message: "Error adding item to cart",
      });
    }
  };

  const handleUpdateQuantity = async (item, quantity) => {
    try {
      await axios.put(`http://localhost:5003/api/cart/${userId}/${item.id}`, {
        quantity,
      });

      setSnackbar({
        open: true,
        message: "Cart updated successfully!",
      });
    } catch (error) {
      console.error("Error updating cart:", error);
      setSnackbar({
        open: true,
        message: "Error updating cart",
      });
    }
  };

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
                <Chip key={tag} label={tag} variant="outlined" />
              ))}
            </Box>
          </Grid>
        </Grid>

        {/* Menu */}
        {restaurant.menu.map((category) => (
          <Box key={category.category} sx={{ mb: 6 }}>
            <Typography variant="h5" gutterBottom>
              {category.category}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={4}>
              {category.items.map((item) => (
                <Grid item key={item.id} xs={12} sm={6} md={4}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.imageUrl}
                      alt={item.name}
                    />
                    <CardContent>
                      <Typography variant="h6">{item.name}</Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        paragraph
                      >
                        {item.description}
                      </Typography>
                      <Typography variant="h6" color="primary">
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
                          >
                            <Add />
                          </IconButton>
                        </Box>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => handleAddToCart(item)}
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
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RestaurantDetail;
