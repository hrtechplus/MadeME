import React, { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ExpandMore,
  LocalShipping,
  AccessTime,
  Receipt,
  LocationOn,
  Restaurant,
  Store,
} from "@mui/icons-material";
import "../styles/OrderHistory.css";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { handleApiCall, serviceUrls } = useApi();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId") || "test-user";
        const response = await handleApiCall(
          fetch(`${serviceUrls.order}/api/orders/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
        );

        if (response && response.data) {
          // Sort orders by date (newest first)
          const sortedOrders = response.data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setOrders(sortedOrders);
        } else {
          setOrders([]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to load order history:", error);
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

  const getStatusIcon = (status) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return <AccessTime />;
      case "CONFIRMED":
        return <Receipt />;
      case "PREPARING":
        return <Restaurant />;
      case "OUT_FOR_DELIVERY":
        return <LocalShipping />;
      case "DELIVERED":
        return <Store />;
      case "REJECTED":
        return <Receipt />;
      default:
        return <Receipt />;
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleOrderClick = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/order/${orderId}`);
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
          <Box display="flex" justifyContent="center" mt={2}>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </Box>
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
          <Typography variant="body1" color="text.secondary" mb={4}>
            You haven't placed any orders yet.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/restaurants")}
          >
            Browse Restaurants
          </Button>
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
        Your Order History
      </Typography>

      <Box
        className="orders-list"
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        {orders.map((order) => (
          <Paper
            key={order._id}
            elevation={2}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            <Box
              className="order-header"
              sx={{
                p: 3,
                bgcolor: "#f8f9fa",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
              }}
              onClick={() => handleOrderClick(order._id)}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Box className="order-info">
                    <Typography variant="h6" sx={{ m: 0, fontWeight: 600 }}>
                      Order #{order._id.slice(-8)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <AccessTime fontSize="small" />
                      {formatDate(order.createdAt)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Restaurant fontSize="small" />
                      Restaurant ID: {order.restaurantId}
                    </Typography>
                  </Box>
                </Grid>
                <Grid
                  item
                  xs={12}
                  sm={6}
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                    alignItems: "center",
                    mt: { xs: 2, sm: 0 },
                  }}
                >
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={order.status.replace(/_/g, " ")}
                    sx={{
                      py: 2,
                      px: 1,
                      fontSize: "0.9rem",
                      color: "white",
                      fontWeight: "bold",
                      bgcolor: getStatusColor(order.status),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Accordion
              expanded={expandedOrder === order._id}
              onChange={() => handleOrderClick(order._id)}
              sx={{ boxShadow: "none" }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{ display: "none" }}
              >
                <Typography>Order Details</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Box className="order-items" sx={{ p: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    Order Items
                  </Typography>
                  {order.items.map((item, index) => (
                    <Box
                      key={item.itemId || index}
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
                        sx={{ flex: 1, fontWeight: 500 }}
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
                        sx={{
                          fontWeight: 500,
                          minWidth: "80px",
                          textAlign: "right",
                        }}
                      >
                        ${(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 2,
                      pt: 2,
                      borderTop: "2px dashed #eee",
                    }}
                  >
                    <Typography variant="subtitle1">Subtotal:</Typography>
                    <Typography variant="subtitle1">
                      ${order.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box className="order-footer" sx={{ p: 3, bgcolor: "#f9f9f9" }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box className="delivery-info" sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            mb: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <LocationOn /> Delivery Address
                        </Typography>
                        <Typography
                          variant="body2"
                          className="delivery-address"
                          sx={{ ml: 3 }}
                        >
                          {order.deliveryAddress ? (
                            <>
                              {order.deliveryAddress.street}
                              <br />
                              {order.deliveryAddress.city},{" "}
                              {order.deliveryAddress.state}{" "}
                              {order.deliveryAddress.zipCode}
                            </>
                          ) : (
                            "No delivery address information available."
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box className="payment-info" sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            mb: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Receipt /> Payment Details
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 3 }}>
                          <strong>Payment ID:</strong>{" "}
                          {order.paymentId || "Pending"}
                          <br />
                          <strong>Payment Method:</strong> Credit Card
                          <br />
                          <strong>Total Amount:</strong> $
                          {order.total.toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleTrackOrder(order._id)}
                      startIcon={<LocalShipping />}
                    >
                      Track Order
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        ))}
      </Box>
    </Container>
  );
};

export default OrderHistory;
