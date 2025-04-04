import React, { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import "../styles/OrderHistory.css";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { handleApiCall } = useApi();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("Please log in to view your orders");
          setLoading(false);
          return;
        }

        const response = await handleApiCall(
          fetch(`http://localhost:5001/api/order/user/${userId}`)
        );
        setOrders(response.data);
      } catch (err) {
        setError("Failed to fetch orders");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [handleApiCall]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ffa500";
      case "confirmed":
        return "#4CAF50";
      case "preparing":
        return "#2196F3";
      case "out_for_delivery":
        return "#9C27B0";
      case "delivered":
        return "#4CAF50";
      case "cancelled":
        return "#f44336";
      default:
        return "#666";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;
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
                  <strong>Delivery Address:</strong> {order.deliveryAddress}
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
