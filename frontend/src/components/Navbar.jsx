import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Badge,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  ShoppingCart,
  AccountCircle,
  ExitToApp,
  Restaurant,
  History,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../services/authService";

function Navbar() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartItems, setCartItems] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());

    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    handleMenuClose();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        background: scrolled ? "rgba(255, 255, 255, 0.95)" : "transparent",
        backdropFilter: "blur(10px)",
        boxShadow: scrolled ? "0 2px 10px rgba(0, 0, 0, 0.1)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <Toolbar sx={{ maxWidth: "1200px", width: "100%", mx: "auto" }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            cursor: "pointer",
            fontWeight: "bold",
            background: "linear-gradient(45deg, #1976d2, #2196f3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
          onClick={() => navigate("/")}
        >
          FoodDelivery
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            color="inherit"
            onClick={() => navigate("/restaurants")}
            startIcon={<Restaurant />}
            sx={{
              borderRadius: 2,
              "&:hover": {
                background: "rgba(25, 118, 210, 0.1)",
              },
            }}
          >
            Restaurants
          </Button>
          {isAuthenticated ? (
            <>
              <Button
                color="inherit"
                onClick={() => navigate("/orders")}
                startIcon={<History />}
                sx={{
                  borderRadius: 2,
                  "&:hover": {
                    background: "rgba(25, 118, 210, 0.1)",
                  },
                }}
              >
                Orders
              </Button>
              <IconButton
                color="inherit"
                onClick={() => navigate("/cart")}
                sx={{
                  borderRadius: 2,
                  "&:hover": {
                    background: "rgba(25, 118, 210, 0.1)",
                  },
                }}
              >
                <Badge badgeContent={cartItems} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                sx={{
                  borderRadius: 2,
                  "&:hover": {
                    background: "rgba(25, 118, 210, 0.1)",
                  },
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: "#1976d2" }}>
                  <AccountCircle />
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: 2,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                <MenuItem onClick={handleLogout} sx={{ py: 1 }}>
                  <ExitToApp sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={() => navigate("/login")}
              sx={{
                borderRadius: 2,
                background: "linear-gradient(45deg, #1976d2, #2196f3)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1565c0, #1e88e5)",
                },
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
