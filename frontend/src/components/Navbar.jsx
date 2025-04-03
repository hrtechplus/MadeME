import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Badge,
  IconButton,
  Box,
} from "@mui/material";
import { ShoppingCart, AccountCircle, ExitToApp } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../services/authService";

function Navbar() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartItems, setCartItems] = useState(0);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          FoodDelivery
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button color="inherit" onClick={() => navigate("/restaurants")}>
            Restaurants
          </Button>
          {isAuthenticated ? (
            <>
              <Button color="inherit" onClick={() => navigate("/orders")}>
                Orders
              </Button>
              <IconButton color="inherit" onClick={() => navigate("/cart")}>
                <Badge badgeContent={cartItems} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>
              <IconButton color="inherit" onClick={handleLogout}>
                <ExitToApp />
              </IconButton>
            </>
          ) : (
            <Button color="inherit" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
