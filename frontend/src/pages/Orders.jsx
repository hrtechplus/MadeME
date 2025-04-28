import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useApi } from "../context/ApiContext";
import { useNavigate } from "react-router-dom";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { handleApiCall, serviceUrls } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId") || "test-user";

      const response = await fetch(
        `${serviceUrls.order}/api/order/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setOrders(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again later.");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold", mb: 4 }}
      >
        Order History
      </Typography>

      {orders.length === 0 ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            You haven't placed any orders yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Restaurant</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order._id}
                  hover
                  onClick={() => navigate(`/order/${order._id}`)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{order._id.slice(-6)}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{`Restaurant ${
                    order.restaurantId ? order.restaurantId.slice(-4) : "N/A"
                  }`}</TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell>{order.status.replace(/_/g, " ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default Orders;
