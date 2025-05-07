import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ApiContext } from "../context/ApiContext";
import { ToastContext } from "../context/ToastContext";
import "../styles/OrderTracking.css"; // Import your CSS styles
import { orderApi } from "../api";

const OrderTracking = () => {
  const { id } = useParams();
  const { handleApiCall, serviceUrls } = useContext(ApiContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(refreshInterval);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Function to fetch tracking data
  const fetchTrackingData = async () => {
    try {
      const response = await orderApi.trackOrder(id);
      setTrackingData(response.data);
      setLoading(false);
      setError(null);

      // Reset the refresh countdown
      setTimeUntilRefresh(refreshInterval);

      // If order is in a final state, stop auto-refresh
      if (
        ["DELIVERED", "CANCELLED", "REJECTED"].includes(response.data.status)
      ) {
        setAutoRefresh(false);
      }
    } catch (err) {
      setError("Could not load tracking information. Please try again.");
      setLoading(false);
      console.error("Error fetching tracking data:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTrackingData();
  }, [id]);

  // Auto-refresh countdown effect
  useEffect(() => {
    if (!autoRefresh || !trackingData) return;

    const countdownInterval = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchTrackingData(); // Refresh data when countdown reaches 0
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoRefresh, refreshInterval, trackingData]);

  // Function to handle order cancellation
  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      // Get user ID directly from localStorage instead of parsing JSON
      const userId = localStorage.getItem("userId");

      if (!userId) {
        showToast("User information not found. Please log in again.", "error");
        return;
      }

      // Use the alternative cancellation endpoint that doesn't rely on token validation
      const response = await orderApi.userCancelOrder(
        id,
        userId,
        "Cancelled by customer"
      );

      if (response.data.success) {
        showToast("Order cancelled successfully", "success");
        fetchTrackingData(); // Refresh data to show cancelled status
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast(
        "Failed to cancel order. " +
          (error.response?.data?.message || "Please try again."),
        "error"
      );
    }
  };

  // Function to handle order modification
  const handleModifyOrder = () => {
    navigate(`/cart?modify=${id}`);
  };

  if (loading) {
    return <div className="loading">Loading order tracking information...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchTrackingData}>Try Again</button>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="not-found">
        <h2>Order Not Found</h2>
        <p>We couldn't find this order. Please check the order ID.</p>
        <Link to="/order-history">View Your Orders</Link>
      </div>
    );
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Calculate progress percentage based on status
  const calculateProgress = () => {
    const statusOrder = [
      "VERIFYING",
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    // Handle special cases
    if (trackingData.status === "CANCELLED") return 0;
    if (trackingData.status === "REJECTED") return 0;

    const index = statusOrder.indexOf(trackingData.status);
    if (index === -1) return 0;

    return Math.round((index / (statusOrder.length - 1)) * 100);
  };

  // Helper function to get status index
  const getStatusIndex = (status) => {
    const statusOrder = [
      "VERIFYING",
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];
    
    return statusOrder.indexOf(status);
  };

  // Helper function to check if a step is complete
  const isStepComplete = (stepStatus) => {
    return getStatusIndex(trackingData.status) >= getStatusIndex(stepStatus);
  };

  // Helper function to check if a step is active
  const isStepActive = (stepStatus) => {
    return trackingData.status === stepStatus;
  };

  // Helper function to get step status class
  const getStepStatusClass = (stepStatus) => {
    if (["CANCELLED", "REJECTED"].includes(trackingData.status)) {
      return stepStatus === trackingData.status ? "step-active" : "step-disabled";
    }
    
    if (isStepActive(stepStatus)) return "step-active";
    if (isStepComplete(stepStatus)) return "step-complete";
    return "step-pending";
  };

  return (
    <div className="order-tracking-container">
      <div className="tracking-header">
        <h1>Order Tracking</h1>
        <div className="order-id">
          <p>Order #{trackingData.orderId}</p>
          <p className="placed-date">
            Placed on {formatDate(trackingData.orderPlacedAt)}
          </p>
        </div>
      </div>

      <div className="status-card">
        <div className="current-status">
          <h2>Current Status: </h2>
          <span
            className={`status status-${trackingData.status.toLowerCase()}`}
          >
            {trackingData.statusDescription}
          </span>
        </div>

        {trackingData.estimatedDeliveryTime && (
          <div className="estimated-time">
            <i className="fa fa-clock-o"></i>
            <span>
              Estimated Delivery:{" "}
              {formatDate(trackingData.estimatedDeliveryTime)}
            </span>
          </div>
        )}

        <div className="progress-section">
          {/* Step Progress Bar */}
          <div className="delivery-progress-bar">
            {["CANCELLED", "REJECTED"].includes(trackingData.status) ? (
              <div className="delivery-progress-error">
                <div className={`progress-step ${getStepStatusClass(trackingData.status)}`}>
                  <div className="step-icon">✕</div>
                  <div className="step-label">{trackingData.status === "CANCELLED" ? "Cancelled" : "Rejected"}</div>
                </div>
                <div className="progress-message">
                  {trackingData.trackingHistory.find(history => 
                    history.status === trackingData.status)?.reason || 
                    "This order is no longer being processed."}
                </div>
              </div>
            ) : (
              <>
                <div className="progress-steps-container">
                  <div className="progress-step-connector">
                    <div className="connector-line" 
                         style={{ width: `${calculateProgress()}%` }}></div>
                  </div>
                  <div className="progress-steps">
                    <div className={`progress-step ${getStepStatusClass("CONFIRMED")}`}>
                      <div className="step-icon">
                        {isStepComplete("CONFIRMED") ? "✓" : "1"}
                      </div>
                      <div className="step-label">Confirmed</div>
                    </div>
                    <div className={`progress-step ${getStepStatusClass("PREPARING")}`}>
                      <div className="step-icon">
                        {isStepComplete("PREPARING") ? "✓" : "2"}
                      </div>
                      <div className="step-label">Preparing</div>
                    </div>
                    <div className={`progress-step ${getStepStatusClass("OUT_FOR_DELIVERY")}`}>
                      <div className="step-icon">
                        {isStepComplete("OUT_FOR_DELIVERY") ? "✓" : "3"}
                      </div>
                      <div className="step-label">Out for Delivery</div>
                    </div>
                    <div className={`progress-step ${getStepStatusClass("DELIVERED")}`}>
                      <div className="step-icon">
                        {isStepComplete("DELIVERED") ? "✓" : "4"}
                      </div>
                      <div className="step-label">Delivered</div>
                    </div>
                  </div>
                </div>
                
                {/* Current Step Details */}
                <div className="current-step-details">
                  {trackingData.status === "PREPARING" && (
                    <div className="step-detail-card">
                      <div className="detail-icon">👨‍🍳</div>
                      <div className="detail-text">
                        <p>Your order is being freshly prepared at the restaurant.</p>
                        <p className="detail-estimate">Estimated preparation time: 15-20 minutes</p>
                      </div>
                    </div>
                  )}
                  
                  {trackingData.status === "OUT_FOR_DELIVERY" && (
                    <div className="step-detail-card">
                      <div className="detail-icon">🚚</div>
                      <div className="detail-text">
                        <p>Your order is on the way to your location!</p>
                        <p className="detail-estimate">
                          Estimated arrival: {trackingData.estimatedDeliveryTime ? 
                            formatDate(trackingData.estimatedDeliveryTime) : 
                            "Soon"}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {trackingData.status === "DELIVERED" && (
                    <div className="step-detail-card">
                      <div className="detail-icon">✅</div>
                      <div className="detail-text">
                        <p>Your order has been delivered. Enjoy your meal!</p>
                        <p className="detail-estimate">
                          Delivered at: {trackingData.trackingHistory.find(
                            h => h.status === "DELIVERED")?.timestamp ? 
                            formatDate(trackingData.trackingHistory.find(
                              h => h.status === "DELIVERED").timestamp) : 
                            "Recently"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Order Status History */}
          <div className="status-history">
            <h3>Order History</h3>
            <div className="history-timeline">
              {trackingData.trackingHistory.map((step, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-point"></div>
                  <div className="timeline-content">
                    <p className="timeline-title">{step.status}</p>
                    <p className="timeline-time">{formatDate(step.timestamp)}</p>
                    {step.reason && <p className="timeline-reason">{step.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="action-buttons">
          {trackingData.canBeModified && (
            <button className="modify-btn" onClick={handleModifyOrder}>
              Modify Order
            </button>
          )}

          {trackingData.canBeCancelled && (
            <button className="cancel-btn" onClick={handleCancelOrder}>
              Cancel Order
            </button>
          )}
        </div>
      </div>

      <div className="order-details-card">
        <h2>Order Details</h2>

        <div className="order-items">
          <h3>Items:</h3>
          <div className="items-list">
            {trackingData.items.map((item, index) => (
              <div key={index} className="item-row">
                <span className="item-quantity">{item.quantity}x</span>
                <span className="item-name">{item.name}</span>
                <span className="item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <strong>Total:</strong>
            <span>${parseFloat(trackingData.total).toFixed(2)}</span>
          </div>
        </div>

        <div className="delivery-info">
          <h3>Delivery Address:</h3>
          <p>
            {trackingData.deliveryAddress.street}
            <br />
            {trackingData.deliveryAddress.city},{" "}
            {trackingData.deliveryAddress.state}{" "}
            {trackingData.deliveryAddress.zipCode}
          </p>
        </div>
      </div>

      <div className="refresh-controls">
        <div className="auto-refresh">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
            />
            Auto-refresh
          </label>
          {autoRefresh && (
            <span className="refresh-countdown">
              (Refreshing in {timeUntilRefresh}s)
            </span>
          )}
        </div>
        <button className="refresh-btn" onClick={fetchTrackingData}>
          Refresh Now
        </button>
      </div>

      <div className="navigation-links">
        <Link to="/order-history">Back to Order History</Link>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
};

export default OrderTracking;
