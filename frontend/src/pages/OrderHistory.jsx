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
  CardHeader,
  CardActions,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  Badge,
  Tooltip,
} from "@mui/material";
import {
  LocalShipping,
  AccessTime,
  Receipt,
  LocationOn,
  Restaurant,
  Store,
  Search,
  FilterList,
  SortByAlpha,
  Cancel,
  Warning,
  Phone,
  Email,
  Payment,
  MenuBook,
  CalendarToday,
  Person,
  Info,
} from "@mui/icons-material";
import "../styles/OrderHistory.css";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurantNames, setRestaurantNames] = useState({});
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);
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
      case "CANCELLED":
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
        return <Cancel />;
      case "CANCELLED":
        return <Cancel />;
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

  const calculateTimeElapsed = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hr ago`;
    
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    
    return `${Math.floor(diffMonths / 12)} year${Math.floor(diffMonths / 12) !== 1 ? 's' : ''} ago`;
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/order-tracking/${orderId}`);
  };

  // Handle opening the cancel dialog
  const handleOpenCancelDialog = (orderId) => {
    setCancelOrderId(orderId);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  // Handle closing the cancel dialog
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setCancelOrderId(null);
    setCancelReason("");
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;

    setIsCancelling(true);
    try {
      const response = await fetch(
        `${serviceUrls.order}/api/order/${cancelOrderId}/cancel`,
        {
          method: "POST",  // Changed from PUT to POST to match the backend route
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ 
            cancellationReason: cancelReason 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel order");
      }

      await response.json();

      // Update the order in the local state
      const updatedOrders = orders.map((order) =>
        order._id === cancelOrderId
          ? { ...order, status: "CANCELLED", rejectionReason: cancelReason }
          : order
      );
      
      setOrders(updatedOrders);
      showToast("Order cancelled successfully", "success");
      handleCloseCancelDialog();
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast(
        error.message || "Failed to cancel order. Please try again.",
        "error"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // View order details
  const handleViewOrderDetails = (order) => {
    setViewOrderDetails(order);
  };

  // Close order details
  const handleCloseOrderDetails = () => {
    setViewOrderDetails(null);
  };

  // Check if an order can be cancelled
  const canCancelOrder = (order) => {
    return order.status === "PENDING" || order.status === "PREPARING";
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
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
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

      {/* Orders Cards Grid */}
      <Grid container spacing={3} className="orders-list">
        {filteredOrders.length === 0 ? (
          <Grid item xs={12}>
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
          </Grid>
        ) : (
          filteredOrders.map((order) => (
            <Grid item xs={12} md={6} lg={4} key={order._id}>
              <Card 
                elevation={3}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                  },
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Status Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bgcolor: getStatusColor(order.status),
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderBottomLeftRadius: 8,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    zIndex: 1,
                  }}
                >
                  {order.status.replace(/_/g, " ")}
                </Box>
                
                <CardHeader
                  avatar={
                    <Avatar 
                      sx={{ 
                        bgcolor: getStatusColor(order.status),
                      }}
                    >
                      {getStatusIcon(order.status)}
                    </Avatar>
                  }
                  title={
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Order #{order._id.slice(-8)}
                    </Typography>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday fontSize="inherit" />
                        {formatDate(order.createdAt)}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontStyle: 'italic' }}>
                        <AccessTime fontSize="inherit" />
                        {calculateTimeElapsed(order.createdAt)}
                      </Typography>
                    </Box>
                  }
                />
                
                <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                  <Typography 
                    variant="body2" 
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                      color: "primary.main",
                      fontWeight: 500,
                    }}
                  >
                    <Restaurant fontSize="small" />
                    {restaurantNames[order.restaurantId] ||
                      `Restaurant ${order.restaurantId.slice(-4)}`}
                  </Typography>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Order Items */}
                  <Box sx={{ mb: 2 }}>
                    {order.items.slice(0, 3).map((item, index) => (
                      <Box
                        key={item.itemId || index}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.5,
                          borderBottom: index < Math.min(order.items.length, 3) - 1 ? '1px dashed #eee' : 'none',
                        }}
                      >
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            component="span" 
                            sx={{ 
                              mr: 1, 
                              bgcolor: 'primary.50', 
                              color: 'primary.main',
                              px: 0.5,
                              borderRadius: 1,
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                            }}
                          >
                            {item.quantity}x
                          </Box>
                          {item.name.length > 20 ? `${item.name.substring(0, 20)}...` : item.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                    
                    {order.items.length > 3 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', fontStyle: 'italic' }}>
                        +{order.items.length - 3} more items
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Delivery Address */}
                  {order.deliveryAddress && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, color: 'text.secondary' }}>
                        <LocationOn fontSize="small" sx={{ mt: 0.2 }} />
                        <span>
                          {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                        </span>
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Total Amount */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: 'grey.50',
                      p: 1.5,
                      borderRadius: 1,
                      mt: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Total:</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      ${order.total.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 1, justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleViewOrderDetails(order)}
                    startIcon={<Info />}
                  >
                    Details
                  </Button>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      color="primary"
                      variant="contained"
                      onClick={() => handleTrackOrder(order._id)}
                      startIcon={<LocalShipping />}
                    >
                      Track
                    </Button>
                    
                    {canCancelOrder(order) && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={() => handleOpenCancelDialog(order._id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle sx={{ bgcolor: '#fff5f5', color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" /> Cancel Order
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="cancel-reason"
            label="Reason for cancellation (optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseCancelDialog} disabled={isCancelling}>
            Keep Order
          </Button>
          <Button
            onClick={handleCancelOrder}
            color="error"
            variant="contained"
            disabled={isCancelling}
            startIcon={<Cancel />}
          >
            {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog 
        open={!!viewOrderDetails} 
        onClose={handleCloseOrderDetails}
        maxWidth="md"
        fullWidth
      >
        {viewOrderDetails && (
          <>
            <DialogTitle 
              sx={{ 
                bgcolor: getStatusColor(viewOrderDetails.status),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1 
              }}
            >
              {getStatusIcon(viewOrderDetails.status)} 
              Order Details #{viewOrderDetails._id.slice(-8)}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Order Info */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Order Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CalendarToday fontSize="small" sx={{ color: 'text.secondary', mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Date Placed</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDate(viewOrderDetails.createdAt)}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Restaurant fontSize="small" sx={{ color: 'text.secondary', mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Restaurant</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {restaurantNames[viewOrderDetails.restaurantId] || 
                            `Restaurant ${viewOrderDetails.restaurantId.slice(-4)}`}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocationOn fontSize="small" sx={{ color: 'text.secondary', mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Delivery Address</Typography>
                        {viewOrderDetails.deliveryAddress ? (
                          <Typography variant="body2" color="text.secondary">
                            {viewOrderDetails.deliveryAddress.street}, {viewOrderDetails.deliveryAddress.city}, 
                            {viewOrderDetails.deliveryAddress.state} {viewOrderDetails.deliveryAddress.zipCode}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No address provided</Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Payment fontSize="small" sx={{ color: 'text.secondary', mt: 0.3 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Payment Information</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {viewOrderDetails.paymentMethod || "Not specified"} 
                          {viewOrderDetails.paymentId ? ` (ID: ${viewOrderDetails.paymentId})` : ""}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Order Items */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Order Items
                  </Typography>
                  
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    {viewOrderDetails.items.map((item, index) => (
                      <Box
                        key={item.itemId || index}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 1,
                          borderBottom: index < viewOrderDetails.items.length - 1 ? '1px solid #eee' : 'none',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ 
                              fontWeight: 'medium',
                              bgcolor: 'primary.50',
                              color: 'primary.main',
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <Typography variant="body2">{item.name}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '2px dashed #eee',
                      mt: 2,
                      pt: 1
                    }}>
                      <Typography variant="subtitle2">Total:</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        ${viewOrderDetails.total.toFixed(2)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Status Timeline */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, mt: 2 }}>
                    Order Status
                  </Typography>
                  
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 10,
                          fontSize: '0.875rem',
                          fontWeight: 'medium',
                          color: 'white',
                          bgcolor: getStatusColor(viewOrderDetails.status),
                        }}
                      >
                        {getStatusIcon(viewOrderDetails.status)}&nbsp;
                        {viewOrderDetails.status.replace(/_/g, " ")}
                      </Box>
                    </Box>
                    
                    {(viewOrderDetails.status === "REJECTED" || viewOrderDetails.status === "CANCELLED") && 
                     viewOrderDetails.rejectionReason && (
                      <Box sx={{ mt: 1, bgcolor: '#fff5f5', p: 1, borderRadius: 1 }}>
                        <Typography variant="body2" color="error">
                          <strong>Reason:</strong> {viewOrderDetails.rejectionReason}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              {canCancelOrder(viewOrderDetails) && (
                <Button
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => {
                    handleCloseOrderDetails();
                    handleOpenCancelDialog(viewOrderDetails._id);
                  }}
                >
                  Cancel Order
                </Button>
              )}
              <Button onClick={handleCloseOrderDetails}>
                Close
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleTrackOrder(viewOrderDetails._id)}
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
