import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Stepper,
  Step,
  StepLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  Chip,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import { Cancel, Warning } from "@mui/icons-material";

const orderSteps = [
  "Order Placed",
  "Payment Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

const statusToStep = {
  VERIFYING: 0,
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  REJECTED: 0,
  CANCELLED: -1, // Set to -1 to indicate this order is no longer in progress
};

function OrderTracking() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const { id } = useParams();
  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await handleApiCall(
        fetch(`${serviceUrls.order}/api/order/${id}`)
      );
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelLoading(true);
    try {
      const response = await handleApiCall(
        fetch(`${serviceUrls.order}/api/order/${id}/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            cancellationReason: cancellationReason,
          }),
        })
      );

      if (response.data.success) {
        showToast("Order cancelled successfully", "success");
        setCancelDialogOpen(false);
        fetchOrder(); // Refresh order data
      } else {
        showToast(response.data.message || "Failed to cancel order", "error");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast("Something went wrong while cancelling the order", "error");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleOpenCancelDialog = () => {
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
  };

  const getStatusChip = (status) => {
    let color = "default";
    let icon = null;

    switch (status) {
      case "VERIFYING":
        color = "warning";
        break;
      case "PENDING":
        color = "info";
        break;
      case "CONFIRMED":
        color = "primary";
        break;
      case "PREPARING":
        color = "secondary";
        break;
      case "OUT_FOR_DELIVERY":
        color = "success";
        break;
      case "DELIVERED":
        color = "success";
        break;
      case "REJECTED":
        color = "error";
        icon = <Warning />;
        break;
      case "CANCELLED":
        color = "error";
        icon = <Cancel />;
        break;
      default:
        color = "default";
    }

    return (
      <Chip
        label={status.replace(/_/g, " ")}
        color={color}
        icon={icon}
        sx={{
          fontWeight: "bold",
          mt: 1,
          mb: 2,
          fontSize: "0.9rem",
        }}
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Order not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Order #{id.slice(-6)}</Typography>
        {getStatusChip(order.status)}
      </Box>

      {(order.status === "CANCELLED" || order.status === "REJECTED") && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {order.status === "CANCELLED"
            ? "This order has been cancelled."
            : "This order has been rejected."}
          {order.rejectionReason && ` Reason: ${order.rejectionReason}`}
        </Alert>
      )}

      {order.status === "VERIFYING" || order.status === "PREPARING" ? (
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {order.status === "VERIFYING"
              ? "Your order is being verified. You can cancel it at this stage if needed."
              : "Your order is being prepared. You can still cancel it at this stage if needed."}
          </Alert>
          <Button
            variant="contained"
            color="error"
            onClick={handleOpenCancelDialog}
            startIcon={<Cancel />}
          >
            Cancel Order
          </Button>
        </Box>
      ) : null}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Stepper
              activeStep={statusToStep[order.status]}
              sx={{ mb: 4 }}
              alternativeLabel
            >
              {orderSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Order Details
            </Typography>
            <List>
              {order.items.map((item) => (
                <div key={item.itemId}>
                  <ListItem>
                    <ListItemText
                      primary={item.name}
                      secondary={`Quantity: ${item.quantity}`}
                    />
                    <Typography>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </ListItem>
                  <Divider />
                </div>
              ))}
            </List>
            <Box sx={{ mt: 2, p: 2, bgcolor: "background.default" }}>
              <Typography variant="subtitle1">
                Total: ${order.total.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Delivery Address
            </Typography>
            <Typography>
              {order.deliveryAddress.street}
              <br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state}
              <br />
              {order.deliveryAddress.zipCode}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

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
            id="reason"
            label="Reason for cancellation (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={cancelLoading}>
            Go Back
          </Button>
          <Button
            onClick={handleCancelOrder}
            color="error"
            variant="contained"
            disabled={cancelLoading}
          >
            {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default OrderTracking;
