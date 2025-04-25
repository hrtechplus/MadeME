import React, { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
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
    return <div className="loading">Loading orders...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="empty-orders">
        <h2>No orders found</h2>
        <p>You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="order-history">
      <h1>Order History</h1>
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Order #{order._id.slice(-6)}</h3>
                <p className="order-date">{formatDate(order.createdAt)}</p>
              </div>
              <div
                className="order-status"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {order.status.replace(/_/g, " ")}
              </div>
            </div>

            <div className="order-items">
              {order.items.map((item) => (
                <div key={item._id} className="order-item">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x {item.quantity}</span>
                  <span className="item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="delivery-info">
                <p className="delivery-address">
                  <strong>Delivery Address:</strong>{" "}
                  {order.deliveryAddress &&
                    `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}`}
                </p>
                {order.driverId && (
                  <p className="driver-info">
                    <strong>Driver:</strong> {order.driverId}
                  </p>
                )}
              </div>
              <div className="order-total">
                <span>Total:</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
