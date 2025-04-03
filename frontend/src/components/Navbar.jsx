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
  Person,
  Logout,
  Restaurant,
  History,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cartItems, setCartItems] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);

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
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsAuthenticated(false);
    handleMenuClose();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        background: scrolled
          ? "rgba(255, 255, 255, 0.95)"
          : "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
        boxShadow: scrolled ? 3 : 0,
        transition: "all 0.3s ease",
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 1,
            cursor: "pointer",
            fontWeight: "bold",
            color: scrolled ? "primary.main" : "white",
          }}
          onClick={() => navigate("/")}
        >
          Food Delivery
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            color={scrolled ? "primary" : "inherit"}
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
              <IconButton
                color={scrolled ? "primary" : "inherit"}
                onClick={() => navigate("/cart")}
              >
                <Badge badgeContent={cartItems} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>

              <IconButton
                color={scrolled ? "primary" : "inherit"}
                onClick={handleMenuOpen}
              >
                <Avatar sx={{ width: 32, height: 32 }} />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <MenuItem onClick={() => navigate("/orders")}>
                  <History sx={{ mr: 1 }} /> Order History
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                color={scrolled ? "primary" : "inherit"}
                onClick={() => navigate("/login")}
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/register")}
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: 2,
                  background:
                    "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)",
                  },
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
