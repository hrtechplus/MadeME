import React, { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from "@mui/material";
import "../styles/OrderHistory.css";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { handleApiCall, serviceUrls } = useApi();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId") || "test-user";
        const response = await handleApiCall(
          fetch(`${serviceUrls.order}/api/orders/user/${userId}`)
        );
        setOrders(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load order history. Please try again.");
        showToast("Failed to load order history", "error");
        setLoading(false);
      }
    };

    fetchOrders();
  }, [handleApiCall, serviceUrls.order, showToast]);

  const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "#ffa500";
      case "CONFIRMED":
        return "#4CAF50";
      case "PREPARING":
        return "#2196F3";
      case "OUT_FOR_DELIVERY":
        return "#9C27B0";
      case "DELIVERED":
        return "#4CAF50";
      case "REJECTED":
        return "#f44336";
      default:
        return "#666";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, my: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, my: 4 }}>
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, bgcolor: "#fff5f5" }}>
          <Typography color="error" variant="h6" align="center">
            Error: {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, my: 4 }}>
        <Paper
          elevation={2}
          sx={{ p: 8, borderRadius: 2, textAlign: "center" }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 500, color: "#333" }}
          >
            No orders found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You haven't placed any orders yet.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, my: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: 500, color: "#333", mb: 4 }}
      >
        Order History
      </Typography>
      <Box
        className="orders-list"
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        {orders.map((order) => (
          <Paper
            key={order._id}
            elevation={2}
            sx={{ borderRadius: 2, overflow: "hidden" }}
          >
            <Box
              className="order-header"
              sx={{ p: 3, bgcolor: "#f8f9fa", borderBottom: "1px solid #eee" }}
            >
              <Box className="order-info">
                <Typography variant="h6" sx={{ m: 0, fontWeight: 500 }}>
                  Order #{order._id.slice(-6)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {formatDate(order.createdAt)}
                </Typography>
              </Box>
              <Box
                className="order-status"
                sx={{
                  py: 1,
                  px: 2,
                  borderRadius: 10,
                  color: "white",
                  fontWeight: "bold",
                  bgcolor: getStatusColor(order.status),
                }}
              >
                {order.status.replace(/_/g, " ")}
              </Box>
            </Box>

            <Box className="order-items" sx={{ p: 3 }}>
              {order.items.map((item) => (
                <Box
                  key={item._id}
                  className="order-item"
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.5,
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <Typography
                    variant="body1"
                    className="item-name"
                    sx={{ flex: 1 }}
                  >
                    {item.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    className="item-quantity"
                    sx={{ mx: 2, color: "#666" }}
                  >
                    x {item.quantity}
                  </Typography>
                  <Typography
                    variant="body1"
                    className="item-price"
                    sx={{ fontWeight: 500 }}
                  >
                    ${(item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              className="order-footer"
              sx={{ p: 3, bgcolor: "#f8f9fa", borderTop: "1px solid #eee" }}
            >
              <Box className="delivery-info" sx={{ mb: 2 }}>
                <Typography variant="body2" className="delivery-address">
                  <strong>Delivery Address:</strong>{" "}
                  {order.deliveryAddress &&
                    `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}`}
                </Typography>
                {order.driverId && (
                  <Typography variant="body2" className="driver-info">
                    <strong>Driver:</strong> {order.driverId}
                  </Typography>
                )}
              </Box>
              <Box
                className="order-total"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                }}
              >
                <Typography variant="body1">Total:</Typography>
                <Typography variant="body1">
                  ${order.total.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    </Container>
  );
};

export default OrderHistory;
