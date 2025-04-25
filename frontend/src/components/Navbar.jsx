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
  Chip,
} from "@mui/material";
import {
  ShoppingCart,
  Person,
  Logout,
  Restaurant,
  History,
  Dashboard,
  Login,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuth from "../services/authService";

function Navbar() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");

  const { getCurrentUser, isAdmin: checkIsAdmin, logout } = useAuth();

  useEffect(() => {
    // Check authentication status and user role
    const { token, role, name } = getCurrentUser();
    setIsAuthenticated(!!token);
    setIsAdmin(role === "admin");
    setUserName(name || "User");

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
    logout();
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
          {isAdmin && (
            <Chip
              size="small"
              label="Admin"
              color="secondary"
              sx={{ ml: 1, fontWeight: "bold" }}
            />
          )}
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

              {/* User profile section with name */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  borderRadius: 2,
                  px: 1,
                  py: 0.5,
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
                onClick={handleMenuOpen}
              >
                <Typography
                  variant="body2"
                  sx={{
                    mr: 1,
                    fontWeight: "medium",
                    color: scrolled ? "text.primary" : "white",
                  }}
                >
                  {userName}
                </Typography>
                <Avatar sx={{ width: 32, height: 32 }} />
              </Box>

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
                <MenuItem sx={{ pointerEvents: "none", opacity: 0.7 }}>
                  <Person sx={{ mr: 1 }} />
                  {userName}
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/orders");
                  }}
                >
                  <History sx={{ mr: 1 }} /> Order History
                </MenuItem>

                {isAdmin && (
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      navigate("/admin/dashboard");
                    }}
                  >
                    <Dashboard sx={{ mr: 1 }} /> Admin Dashboard
                  </MenuItem>
                )}

                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color={scrolled ? "primary" : "inherit"}
              variant="outlined"
              onClick={() => navigate("/login")}
              startIcon={<Login />}
              sx={{
                borderColor: scrolled ? "primary.main" : "white",
                color: scrolled ? "primary.main" : "white",
                "&:hover": {
                  borderColor: scrolled ? "primary.dark" : "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
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
