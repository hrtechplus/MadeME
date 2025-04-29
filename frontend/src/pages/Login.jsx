import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../services/authService";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Divider,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Google,
  Facebook,
  Apple,
} from "@mui/icons-material";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Redirect to home page after successful login
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      // Handle specific error messages more gracefully
      if (
        error.message.includes("Too Many Requests") ||
        error.message.includes("429")
      ) {
        setError(
          "Too many login attempts. Please wait a moment and try again."
        );
      } else if (error.message.includes("Unexpected token")) {
        setError(
          "The server is currently busy. Please try again in a few moments."
        );
      } else {
        setError(error.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Rest of the code remains the same
  const handleSampleLogin = async () => {
    setEmail("user@example.com");
    setPassword("password123");
    setError("");
    setLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      localStorage.setItem("token", "sample-token");
      localStorage.setItem("userId", "sample-user-id");
      setLoading(false);
      navigate("/");
    }, 1500);
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
        }}
      >
        <Box
          sx={{
            p: 4,
            pb: 3,
            background: "linear-gradient(120deg, #2563eb 0%, #3b82f6 100%)",
            color: "white",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Welcome Back
          </Typography>
          <Typography variant="body1">
            Sign in to continue to your account
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            <Box sx={{ textAlign: "right", mb: 3 }}>
              <Link to="/forgot-password" style={{ textDecoration: "none" }}>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    fontWeight: 500,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Forgot password?
                </Typography>
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              size="large"
              sx={{
                py: 1.5,
                fontWeight: 600,
                position: "relative",
                mb: 3,
                borderRadius: 2,
              }}
            >
              {loading ? (
                <CircularProgress
                  size={24}
                  sx={{
                    color: "white",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleSampleLogin}
            disabled={loading}
            sx={{ mb: 3, py: 1.2, borderRadius: 2 }}
          >
            Demo Login (No Sign Up Required)
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
              OR CONTINUE WITH
            </Typography>
          </Divider>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
              mb: 4,
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Google />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                minWidth: isMobile ? "100%" : "120px",
                borderColor: "#dddddd",
                color: "#5f6368",
                "&:hover": {
                  borderColor: "#cccccc",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              Google
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Facebook />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                minWidth: isMobile ? "100%" : "120px",
                borderColor: "#1877f2",
                color: "#1877f2",
                "&:hover": {
                  borderColor: "#166fe5",
                  backgroundColor: "#f0f7ff",
                },
              }}
            >
              Facebook
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Apple />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                minWidth: isMobile ? "100%" : "120px",
                borderColor: "#333333",
                color: "#333333",
                "&:hover": {
                  borderColor: "#111111",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              Apple
            </Button>
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{" "}
              <Link
                to="/register"
                style={{
                  textDecoration: "none",
                  fontWeight: 500,
                  color: theme.palette.primary.main,
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;
