import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Divider,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const statusColors = {
  PENDING: "warning",
  CONFIRMED: "info",
  PREPARING: "secondary",
  OUT_FOR_DELIVERY: "primary",
  DELIVERED: "success",
};

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = "user123"; // Replace with actual user ID from auth

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/orders/user/${userId}`
      );
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Order History
      </Typography>
      <Paper elevation={3}>
        {orders.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography>No orders found</Typography>
          </Box>
        ) : (
          <List>
            {orders.map((order) => (
              <div key={order._id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        <Typography variant="h6">
                          Order #{order._id.slice(-6)}
                        </Typography>
                        <Chip
                          label={order.status}
                          color={statusColors[order.status]}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(order.createdAt)}
                        </Typography>
                        <Typography variant="body2">
                          {order.items.length} items • Total: $
                          {order.total.toFixed(2)}
                        </Typography>
                      </>
                    }
                  />
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/order/${order._id}`)}
                    sx={{ ml: 2 }}
                  >
                    View Details
                  </Button>
                </ListItem>
                <Divider />
              </div>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
}

export default OrderHistory;
