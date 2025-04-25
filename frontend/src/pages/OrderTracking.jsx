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
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useApi } from "../context/ApiContext";

const orderSteps = [
  "Order Placed",
  "Payment Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
];

const statusToStep = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  REJECTED: 0, // Add REJECTED status mapping
};

function OrderTracking() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { serviceUrls, handleApiCall } = useApi();

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await handleApiCall(
        fetch(`${serviceUrls.order}/api/orders/${id}`)
      );
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
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
      <Typography variant="h4" gutterBottom>
        Order #{id}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Stepper activeStep={statusToStep[order.status]} sx={{ mb: 4 }}>
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
    </Container>
  );
}

export default OrderTracking;
