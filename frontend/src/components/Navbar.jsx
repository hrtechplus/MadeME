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
  Container,
  useScrollTrigger,
  Slide,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ShoppingCart,
  Person,
  Logout,
  Restaurant,
  History,
  Dashboard,
  Login,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import useAuth from "../services/authService";

// Hide AppBar on scroll down
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { getCurrentUser, isAdmin: checkIsAdmin, logout } = useAuth();

  useEffect(() => {
    // Check authentication status and user role
    const { token, role, name } = getCurrentUser();
    setIsAuthenticated(!!token);
    setIsAdmin(role === "admin");
    setUserName(name || "User");

    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [getCurrentUser]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    handleMobileMenuClose();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Restaurants",
      icon: <Restaurant sx={{ mr: 1 }} />,
      path: "/restaurants",
    },
  ];

  if (isAuthenticated) {
    navItems.push({
      label: "Orders",
      icon: <History sx={{ mr: 1 }} />,
      path: "/orders",
    });
    if (isAdmin) {
      navItems.push({
        label: "Dashboard",
        icon: <Dashboard sx={{ mr: 1 }} />,
        path: "/admin/dashboard",
      });
    }
  }

  return (
    <HideOnScroll>
      <AppBar
        position="sticky"
        elevation={scrolled ? 4 : 0}
        sx={{
          background: scrolled
            ? "rgba(255, 255, 255, 0.95)"
            : "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
          backdropFilter: "blur(10px)",
          borderBottom: scrolled ? "1px solid rgba(0, 0, 0, 0.05)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ py: 1, px: { xs: 1, sm: 2 } }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: { xs: 1, md: 0 },
                mr: { md: 4 },
                fontWeight: "bold",
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
                letterSpacing: "-0.5px",
                cursor: "pointer",
                color: scrolled ? "primary.main" : "white",
                display: "flex",
                alignItems: "center",
              }}
              onClick={() => navigate("/")}
            >
              Food Delivery
              {isAdmin && (
                <Chip
                  size="small"
                  label="Admin"
                  color="secondary"
                  sx={{ ml: 1, fontWeight: "bold", height: 20 }}
                />
              )}
            </Typography>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: "none", md: "flex" }, ml: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  color={scrolled ? "primary" : "inherit"}
                  onClick={() => navigate(item.path)}
                  startIcon={item.icon}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    fontWeight: 500,
                    py: 1,
                    "&:hover": {
                      background: scrolled
                        ? "rgba(25, 118, 210, 0.08)"
                        : "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Cart and User Profile */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {isAuthenticated && (
                <IconButton
                  color={scrolled ? "primary" : "inherit"}
                  sx={{ mr: { xs: 1, sm: 2 } }}
                  onClick={() => navigate("/cart")}
                >
                  <Badge badgeContent={cartItems} color="error">
                    <ShoppingCart />
                  </Badge>
                </IconButton>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  edge="end"
                  color={scrolled ? "primary" : "inherit"}
                  aria-label="menu"
                  onClick={handleMobileMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              {/* Desktop User Menu */}
              {!isMobile && (
                <>
                  {isAuthenticated ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        borderRadius: 2,
                        px: 2,
                        py: 0.5,
                        "&:hover": {
                          bgcolor: scrolled
                            ? "rgba(0, 0, 0, 0.04)"
                            : "rgba(255, 255, 255, 0.1)",
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
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        {userName}
                      </Typography>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: scrolled ? "primary.main" : "white",
                          color: scrolled ? "white" : "primary.main",
                        }}
                      >
                        {userName.charAt(0).toUpperCase()}
                      </Avatar>
                    </Box>
                  ) : (
                    <Button
                      color={scrolled ? "primary" : "inherit"}
                      variant={scrolled ? "outlined" : "text"}
                      onClick={() => navigate("/login")}
                      startIcon={<Login />}
                      sx={{
                        borderColor: scrolled ? "primary.main" : "white",
                        color: scrolled ? "primary.main" : "white",
                        borderRadius: 2,
                        py: 1,
                        "&:hover": {
                          borderColor: scrolled ? "primary.dark" : "white",
                          backgroundColor: scrolled
                            ? "rgba(25, 118, 210, 0.08)"
                            : "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                    >
                      Login
                    </Button>
                  )}
                </>
              )}

              {/* User Menu Dropdown */}
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
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem
                  sx={{
                    pointerEvents: "none",
                    opacity: 0.7,
                    py: 1.5,
                  }}
                >
                  <Person sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {userName}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate("/orders");
                  }}
                  sx={{ py: 1.5 }}
                >
                  <History sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">Order History</Typography>
                </MenuItem>

                {isAdmin && (
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      navigate("/admin/dashboard");
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <Dashboard sx={{ mr: 1, fontSize: 20 }} />
                    <Typography variant="body2">Admin Dashboard</Typography>
                  </MenuItem>
                )}

                <Divider />
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    py: 1.5,
                    color: "error.main",
                  }}
                >
                  <Logout sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">Logout</Typography>
                </MenuItem>
              </Menu>

              {/* Mobile Menu */}
              <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                {isAuthenticated && (
                  <MenuItem
                    sx={{
                      pointerEvents: "none",
                      opacity: 0.7,
                      py: 1.5,
                      borderBottom: "1px solid rgba(0,0,0,0.1)",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        mr: 1.5,
                        bgcolor: "primary.main",
                        fontSize: "0.8rem",
                      }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {userName}
                    </Typography>
                  </MenuItem>
                )}

                {navItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    onClick={() => {
                      handleMobileMenuClose();
                      navigate(item.path);
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <Box
                      sx={{ mr: 1.5, display: "flex", alignItems: "center" }}
                    >
                      {item.icon}
                    </Box>
                    <Typography variant="body2">{item.label}</Typography>
                  </MenuItem>
                ))}

                {isAuthenticated && (
                  <MenuItem
                    onClick={() => {
                      handleMobileMenuClose();
                      navigate("/cart");
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <Box
                      sx={{ mr: 1.5, display: "flex", alignItems: "center" }}
                    >
                      <Badge badgeContent={cartItems} color="error">
                        <ShoppingCart />
                      </Badge>
                    </Box>
                    <Typography variant="body2">Cart</Typography>
                  </MenuItem>
                )}

                <Divider />

                {isAuthenticated ? (
                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      py: 1.5,
                      color: "error.main",
                    }}
                  >
                    <Logout sx={{ mr: 1.5 }} />
                    <Typography variant="body2">Logout</Typography>
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={() => {
                      handleMobileMenuClose();
                      navigate("/login");
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <Login sx={{ mr: 1.5 }} />
                    <Typography variant="body2">Login</Typography>
                  </MenuItem>
                )}
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </HideOnScroll>
  );
}

export default Navbar;
