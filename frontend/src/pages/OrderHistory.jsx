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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import {
  ExpandMore,
  LocalShipping,
  AccessTime,
  Receipt,
  LocationOn,
  Restaurant,
  Store,
  Search,
  FilterList,
  SortByAlpha,
  PaymentOutlined,
  CreditCard,
  LocalAtm,
  AccountBalanceWallet,
  Cancel,
  InfoOutlined,
} from "@mui/icons-material";
import "../styles/OrderHistory.css";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurantNames, setRestaurantNames] = useState({});
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const { handleApiCall, serviceUrls } = useApi();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Cancel order dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId") || "test-user";

        // Direct fetch with better error handling
        const response = await fetch(
          `${serviceUrls.order}/api/orders/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Orders fetched:", data); // Debug log to see data structure

        if (Array.isArray(data)) {
          setOrders(data);
          setFilteredOrders(data);
        } else {
          console.warn("Unexpected data format:", data);
          setOrders([]);
          setFilteredOrders([]);
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
  }, [serviceUrls.order, showToast]);

  // Fetch restaurant names
  useEffect(() => {
    const fetchRestaurantNames = async () => {
      const restaurantIds = [
        ...new Set(orders.map((order) => order.restaurantId)),
      ];

      if (restaurantIds.length === 0) return;

      try {
        const namesObj = {};

        // Use mock restaurant data for now, but in a real app you would fetch from API
        // This simulates fetching restaurant names
        restaurantIds.forEach((id) => {
          namesObj[id] = `Restaurant ${id.slice(-4)}`;
        });

        // Try to fetch actual names if the restaurant service is available
        try {
          for (const id of restaurantIds) {
            const response = await handleApiCall(
              fetch(`${serviceUrls.restaurant}/api/restaurants/${id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              })
            );

            if (response && response.data && response.data.name) {
              namesObj[id] = response.data.name;
            }
          }
        } catch (err) {
          console.log("Using mock restaurant names");
        }

        setRestaurantNames(namesObj);
      } catch (error) {
        console.error("Failed to fetch restaurant names:", error);
      }
    };

    if (orders.length > 0) {
      fetchRestaurantNames();
    }
  }, [orders, handleApiCall, serviceUrls.restaurant]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...orders];

    // Apply status filter
    if (statusFilter !== "ALL") {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order._id.toLowerCase().includes(query) ||
          (restaurantNames[order.restaurantId] &&
            restaurantNames[order.restaurantId]
              .toLowerCase()
              .includes(query)) ||
          order.items.some((item) => item.name.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortOrder === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOrder === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortOrder === "highestTotal") {
      result.sort((a, b) => b.total - a.total);
    } else if (sortOrder === "lowestTotal") {
      result.sort((a, b) => a.total - b.total);
    }

    setFilteredOrders(result);
  }, [orders, statusFilter, sortOrder, searchQuery, restaurantNames]);

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

  const getPaymentMethodIcon = (method) => {
    if (!method) return <PaymentOutlined />;

    switch (method.toUpperCase()) {
      case "CARD":
        return <CreditCard />;
      case "COD":
        return <LocalAtm />;
      case "PAYPAL":
        return <AccountBalanceWallet />;
      default:
        return <PaymentOutlined />;
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
    // Find the order to log its data for debugging
    const order = orders.find((o) => o._id === orderId);
    if (order) {
      console.log("Order details:", order);
      // Check if items array exists
      if (
        !order.items ||
        !Array.isArray(order.items) ||
        order.items.length === 0
      ) {
        console.warn("Order items missing or empty:", order);
      }
    }

    // Toggle expansion
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/order-tracking/${orderId}`);
  };

  // Get summary statistics
  const getSummaryStats = () => {
    if (orders.length === 0)
      return { count: 0, total: 0, pending: 0, delivered: 0 };

    return {
      count: orders.length,
      total: orders.reduce((sum, order) => sum + order.total, 0).toFixed(2),
      pending: orders.filter((order) =>
        ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(
          order.status
        )
      ).length,
      delivered: orders.filter((order) => order.status === "DELIVERED").length,
    };
  };

  const stats = getSummaryStats();

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

  // Handle opening the detailed order view dialog
  const handleViewOrderDetails = (order) => {
    setSelectedOrderDetails(order);
    setOrderDetailsDialogOpen(true);
  };

  // Handle opening the cancel order dialog
  const handleCancelOrderClick = (orderId) => {
    setCancelOrderId(orderId);
    setCancellationReason("");
    setCancelDialogOpen(true);
  };

  // Handle cancel order dialog close
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setCancelOrderId(null);
    setCancellationReason("");
  };

  // Handle order cancellation
  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    setIsCancelling(true);

    try {
      // Get user ID directly from localStorage instead of trying to parse JSON
      const userId = localStorage.getItem("userId");

      if (!userId) {
        showToast("User information not found. Please log in again.", "error");
        setIsCancelling(false);
        return;
      }

      // Use the new alternative method for cancellation
      const response = await fetch(
        `${serviceUrls.order}/api/orders/${cancelOrderId}/user-cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            cancellationReason: cancellationReason || "Cancelled by customer",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const result = await response.json();

      // Update the order status in the local state
      setOrders(
        orders.map((order) =>
          order._id === cancelOrderId
            ? { ...order, status: "CANCELLED" }
            : order
        )
      );

      showToast("Order cancelled successfully", "success");
      handleCloseCancelDialog();
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast(`Failed to cancel order: ${error.message}`, "error");
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle status update dialog open
  const handleStatusUpdateClick = (orderId) => {
    setSelectedOrderId(orderId);
    setNewStatus("");
    setStatusUpdateDialogOpen(true);
  };

  // Handle status change in status update dialog
  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  // Handle status update dialog close
  const handleCloseStatusDialog = () => {
    setStatusUpdateDialogOpen(false);
    setSelectedOrderId(null);
    setNewStatus("");
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedOrderId || !newStatus) return;

    setIsUpdatingStatus(true);

    try {
      const response = await fetch(
        `${serviceUrls.order}/api/orders/${selectedOrderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      // Update the order status in the local state
      setOrders(
        orders.map((order) =>
          order._id === selectedOrderId
            ? { ...order, status: newStatus }
            : order
        )
      );

      showToast(`Order status updated to ${newStatus}`, "success");
      handleCloseStatusDialog();
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast(`Failed to update status: ${error.message}`, "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={1}
            sx={{ p: 3, borderRadius: 2, bgcolor: "#f0f7ff" }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Total Orders
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 600 }}>
              {stats.count}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={1}
            sx={{ p: 3, borderRadius: 2, bgcolor: "#fff8e6" }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Total Spent
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 600 }}>
              ${stats.total}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={1}
            sx={{ p: 3, borderRadius: 2, bgcolor: "#f0f9ff" }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Pending Orders
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 600 }}>
              {stats.pending}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={1}
            sx={{ p: 3, borderRadius: 2, bgcolor: "#f0fff4" }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Delivered Orders
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 600 }}>
              {stats.delivered}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <FilterList sx={{ mr: 1, fontSize: 20 }} />
                  Filter by Status
                </Box>
              </InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="ALL">All Orders</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                <MenuItem value="PREPARING">Preparing</MenuItem>
                <MenuItem value="OUT_FOR_DELIVERY">Out for Delivery</MenuItem>
                <MenuItem value="DELIVERED">Delivered</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-order-label">
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <SortByAlpha sx={{ mr: 1, fontSize: 20 }} />
                  Sort By
                </Box>
              </InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="highestTotal">Highest Total</MenuItem>
                <MenuItem value="lowestTotal">Lowest Total</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Count */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredOrders.length} of {orders.length} orders
        </Typography>
      </Box>

      {/* Orders List */}
      <Box
        className="orders-list"
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        {filteredOrders.length === 0 ? (
          <Paper
            elevation={1}
            sx={{ p: 4, borderRadius: 2, textAlign: "center" }}
          >
            <Typography variant="h6" color="text.secondary">
              No orders match your filters
            </Typography>
            <Button
              variant="text"
              color="primary"
              onClick={() => {
                setStatusFilter("ALL");
                setSortOrder("newest");
                setSearchQuery("");
              }}
              sx={{ mt: 2 }}
            >
              Clear Filters
            </Button>
          </Paper>
        ) : (
          filteredOrders.map((order) => (
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
                        sx={{
                          mt: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          color: "primary.main",
                          fontWeight: 500,
                        }}
                      >
                        <Restaurant fontSize="small" />
                        {restaurantNames[order.restaurantId] ||
                          `Restaurant ${order.restaurantId.slice(-4)}`}
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
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "primary.main",
                        }}
                      >
                        ${order.total.toFixed(2)}
                      </Typography>
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
                    </Stack>
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
                    {order.items.slice(0, 3).map((item, index) => (
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
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            className="item-quantity"
                            sx={{
                              mr: 2,
                              bgcolor: "primary.50",
                              color: "primary.main",
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontWeight: "bold",
                              minWidth: "30px",
                              textAlign: "center",
                            }}
                          >
                            {item.quantity}x
                          </Typography>
                          <Typography
                            variant="body1"
                            className="item-name"
                            sx={{ fontWeight: 500 }}
                          >
                            {item.name}
                          </Typography>
                        </Box>
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

                    {order.items.length > 3 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 2, fontStyle: "italic" }}
                      >
                        +{order.items.length - 3} more items
                      </Typography>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 2,
                        pt: 2,
                        borderTop: "2px dashed #eee",
                      }}
                    >
                      <Typography variant="subtitle1">Total Amount:</Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold" }}
                      >
                        ${order.total.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box
                    className="order-footer"
                    sx={{ p: 3, bgcolor: "#f9f9f9" }}
                  >
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
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <strong>Payment ID:</strong>{" "}
                              {order.paymentId || "Pending"}
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <strong>Payment Method:</strong>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                {getPaymentMethodIcon(order.paymentMethod)}
                                {order.paymentMethod || "Credit Card"}
                              </Box>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <strong>Total Amount:</strong> $
                              {order.total.toFixed(2)}
                            </Box>
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box
                      sx={{
                        mt: 3,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 2,
                      }}
                    >
                      <Button
                        variant="outlined"
                        color="info"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewOrderDetails(order);
                        }}
                        startIcon={<InfoOutlined />}
                      >
                        Details
                      </Button>

                      {["PENDING", "CONFIRMED", "PREPARING"].includes(
                        order.status
                      ) && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrderClick(order._id);
                          }}
                          startIcon={<Cancel />}
                        >
                          Cancel Order
                        </Button>
                      )}

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
          ))
        )}
      </Box>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialogOpen} onClose={handleCloseStatusDialog}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Select the new status for this order:
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="new-status-label">New Status</InputLabel>
            <Select
              labelId="new-status-label"
              value={newStatus}
              onChange={handleStatusChange}
              label="New Status"
            >
              <MenuItem value="CONFIRMED">Confirmed</MenuItem>
              <MenuItem value="OUT_FOR_DELIVERY">Out For Delivery</MenuItem>
              <MenuItem value="DELIVERED">Delivered</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={isUpdatingStatus}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            color="primary"
            disabled={isUpdatingStatus || !newStatus}
          >
            {isUpdatingStatus ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this order? This action cannot be
            undone.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="cancellation-reason"
            label="Reason for cancellation (optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={isCancelling}>
            Back
          </Button>
          <Button
            onClick={handleCancelOrder}
            color="error"
            disabled={isCancelling}
            variant="contained"
          >
            {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog
        open={orderDetailsDialogOpen}
        onClose={() => setOrderDetailsDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        {selectedOrderDetails && (
          <>
            <DialogTitle sx={{ borderBottom: "1px solid #eee", px: 3, py: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6">
                  Order Details #{selectedOrderDetails._id.slice(-8)}
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedOrderDetails.status)}
                  label={selectedOrderDetails.status.replace(/_/g, " ")}
                  sx={{
                    py: 1,
                    px: 1,
                    fontSize: "0.8rem",
                    color: "white",
                    fontWeight: "bold",
                    bgcolor: getStatusColor(selectedOrderDetails.status),
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "#f8f9fa",
                      borderRadius: 2,
                      height: "100%",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      Order Information
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Order ID:
                        </Typography>
                        <Typography variant="body2">
                          {selectedOrderDetails._id}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Date Placed:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(selectedOrderDetails.createdAt)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Restaurant:
                        </Typography>
                        <Typography variant="body2">
                          {restaurantNames[selectedOrderDetails.restaurantId] ||
                            `Restaurant ${selectedOrderDetails.restaurantId.slice(
                              -4
                            )}`}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Total Amount:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${selectedOrderDetails.total.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "#f8f9fa",
                      borderRadius: 2,
                      height: "100%",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      Delivery Information
                    </Typography>
                    {selectedOrderDetails.deliveryAddress ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Street:
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrderDetails.deliveryAddress.street}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            City:
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrderDetails.deliveryAddress.city}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            State:
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrderDetails.deliveryAddress.state}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            ZIP Code:
                          </Typography>
                          <Typography variant="body2">
                            {selectedOrderDetails.deliveryAddress.zipCode}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2">
                        No delivery address information available.
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{ p: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 2 }}
                    >
                      Order Items
                    </Typography>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="center">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrderDetails.items.map((item, index) => (
                          <TableRow key={item.itemId || index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="center">
                              {item.quantity}
                            </TableCell>
                            <TableCell align="right">
                              ${item.price.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              ${(item.price * item.quantity).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={2} />
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            Total:
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            ${selectedOrderDetails.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>
                </Grid>

                {selectedOrderDetails.specialInstructions && (
                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Special Instructions
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrderDetails.specialInstructions}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ borderTop: "1px solid #eee", px: 3, py: 2 }}>
              {["PENDING", "CONFIRMED", "PREPARING"].includes(
                selectedOrderDetails.status
              ) && (
                <Button
                  color="error"
                  onClick={() => {
                    setOrderDetailsDialogOpen(false);
                    handleCancelOrderClick(selectedOrderDetails._id);
                  }}
                  startIcon={<Cancel />}
                >
                  Cancel Order
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => setOrderDetailsDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setOrderDetailsDialogOpen(false);
                  handleTrackOrder(selectedOrderDetails._id);
                }}
                startIcon={<LocalShipping />}
              >
                Track Order
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default OrderHistory;
