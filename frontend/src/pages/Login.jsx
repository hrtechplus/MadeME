import { useState } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Grid,
} from "@mui/material";
import { Person, AdminPanelSettings, LockOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import useAuth from "../services/authService";
import { styled } from "@mui/material/styles";

// Custom styling for the login tabs
const LoginTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "1rem",
  textTransform: "none",
  minHeight: 60,
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Login() {
  const [tabValue, setTabValue] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError("");
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(userEmail, userPassword);
      navigate("/");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(adminEmail, adminPassword);
      if (result && result.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        setError("You don't have admin privileges");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          mb: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 0,
            width: "100%",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <LoginTab
                label="User Login"
                icon={<Person />}
                iconPosition="start"
              />
              <LoginTab
                label="Admin Login"
                icon={<AdminPanelSettings />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* User Login Panel */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 4, pb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Avatar sx={{ m: 1, bgcolor: "primary.main" }}>
                  <LockOutlined />
                </Avatar>
                <Typography component="h1" variant="h5">
                  Customer Login
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, textAlign: "center" }}
                >
                  Log in to order food and track your deliveries
                </Typography>
              </Box>

              {error && tabValue === 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleUserLogin}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                  placeholder="test@example.com"
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                  placeholder="password123"
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: "bold" }}
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>

                <Grid container spacing={1}>
                  <Grid item xs>
                    <Typography variant="body2" color="text.secondary">
                      Demo User: test@example.com
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      Password: password123
                    </Typography>
                  </Grid>
                </Grid>
              </form>
            </Box>
          </TabPanel>

          {/* Admin Login Panel */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 4, pb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                  <AdminPanelSettings />
                </Avatar>
                <Typography component="h1" variant="h5">
                  Administrator Login
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, textAlign: "center" }}
                >
                  Log in to access the administration dashboard
                </Typography>
              </Box>

              {error && tabValue === 1 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleAdminLogin}>
                <TextField
                  label="Admin Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="admin@mademe.com"
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="admin123"
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  color="secondary"
                  sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: "bold" }}
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login as Administrator"}
                </Button>

                <Grid container spacing={1}>
                  <Grid item xs>
                    <Typography variant="body2" color="text.secondary">
                      Demo Admin: admin@mademe.com
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      Password: admin123
                    </Typography>
                  </Grid>
                </Grid>
              </form>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
