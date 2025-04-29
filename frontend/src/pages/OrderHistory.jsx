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

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId") || "test-user";

        // Direct fetch with better error handling
        const response = await fetch(
          `${serviceUrls.order}/api/order/user/${userId}`,
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
                      {order.status === "PREPARING" && (
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdateClick(order._id);
                          }}
                        >
                          Update Status
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
    </Container>
  );
};

export default OrderHistory;
