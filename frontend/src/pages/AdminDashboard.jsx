import { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else {
      fetchPayments();
    }
  }, [
    activeTab,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    dateFilter,
  ]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Build query parameters
      let queryParams = new URLSearchParams();
      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter.toUpperCase());
      }
      if (dateFilter.startDate) {
        queryParams.append("startDate", dateFilter.startDate);
      }
      if (dateFilter.endDate) {
        queryParams.append("endDate", dateFilter.endDate);
      }

      const response = await handleApiCall(
        fetch(
          `${serviceUrls.order}/api/order/admin/all?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "x-admin-auth": "true", // Add special admin header for development mode
            },
          }
        )
      );

      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showToast(
        "Failed to fetch orders. Please ensure you have admin access.",
        "error"
      );
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Build query parameters
      let queryParams = new URLSearchParams();
      if (paymentStatusFilter !== "all") {
        queryParams.append("status", paymentStatusFilter.toUpperCase());
      }
      if (paymentMethodFilter !== "all") {
        queryParams.append("paymentMethod", paymentMethodFilter.toUpperCase());
      }
      if (dateFilter.startDate) {
        queryParams.append("startDate", dateFilter.startDate);
      }
      if (dateFilter.endDate) {
        queryParams.append("endDate", dateFilter.endDate);
      }

      // Fetch payments from API
      const response = await handleApiCall(
        fetch(
          `${
            serviceUrls.payment
          }/api/payment/admin/all?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "x-admin-auth": "true", // Add special admin header for development mode
            },
          }
        )
      );

      setPayments(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching payments:", error);
      showToast(
        "Failed to fetch payments. Please ensure you have admin access.",
        "error"
      );
      setLoading(false);
      setPayments([]); // Reset to empty array on error
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await handleApiCall(
        fetch(`${serviceUrls.order}/api/order/${orderId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-admin-auth": "true", // Add special admin header for development mode
          },
          body: JSON.stringify({ status: newStatus }),
        })
      );

      showToast(`Order status updated to ${newStatus}`, "success");

      // Update the order status in the local state
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Failed to update order status", "error");
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  // Pagination logic for orders
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalOrderPages = Math.ceil(orders.length / itemsPerPage);

  // Pagination logic for payments
  const indexOfLastPayment = currentPage * itemsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - itemsPerPage;
  const currentPayments = payments.slice(
    indexOfFirstPayment,
    indexOfLastPayment
  );
  const totalPaymentPages = Math.ceil(payments.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const getStatusChipClass = (status) => {
    switch (status) {
      case "PENDING":
        return "status-pending";
      case "COMPLETED":
        return "status-completed";
      case "FAILED":
        return "status-failed";
      default:
        return "";
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Order Management
        </button>
        <button
          className={`tab-button ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          Payment Management
        </button>
      </div>

      {activeTab === "orders" ? (
        <>
          <h2>Order Management</h2>
          <div className="filters">
            <div className="filter-group">
              <label>Status Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Orders</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
                <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Date Range:</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, startDate: e.target.value })
                  }
                  placeholder="Start Date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, endDate: e.target.value })
                  }
                  placeholder="End Date"
                />
              </div>
            </div>

            <button className="refresh-btn" onClick={fetchOrders}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading orders...</div>
          ) : (
            <>
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.length > 0 ? (
                      currentOrders.map((order) => (
                        <tr key={order._id}>
                          <td>{order._id.substring(0, 8)}...</td>
                          <td>{order.userId}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>{order.items.length} items</td>
                          <td>${order.total.toFixed(2)}</td>
                          <td>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateStatus(order._id, e.target.value)
                              }
                              className={`status-select status-${order.status.toLowerCase()}`}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="PREPARING">Preparing</option>
                              <option value="OUT_FOR_DELIVERY">
                                Out For Delivery
                              </option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </td>
                          <td>
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="view-details-btn"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-orders-found">
                          No orders found with the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Order Pagination Controls */}
              {orders.length > 0 && (
                <div className="pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="page-btn"
                  >
                    Previous
                  </button>

                  <div className="page-numbers">
                    {[...Array(totalOrderPages).keys()].map((number) => (
                      <button
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={`page-number ${
                          currentPage === number + 1 ? "active" : ""
                        }`}
                      >
                        {number + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalOrderPages}
                    className="page-btn"
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="order-stats">
                <p>Total Orders: {orders.length}</p>
                <p>
                  Showing {orders.length > 0 ? indexOfFirstOrder + 1 : 0} -{" "}
                  {Math.min(indexOfLastOrder, orders.length)} of {orders.length}
                </p>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <h2>Payment Management</h2>
          <div className="filters">
            <div className="filter-group">
              <label>Payment Status:</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
              >
                <option value="all">All Payments</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Payment Method:</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="CARD">Credit Card</option>
                <option value="PAYPAL">PayPal</option>
                <option value="COD">Cash on Delivery</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Date Range:</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, startDate: e.target.value })
                  }
                  placeholder="Start Date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, endDate: e.target.value })
                  }
                  placeholder="End Date"
                />
              </div>
            </div>

            <button className="refresh-btn" onClick={fetchPayments}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading payments...</div>
          ) : (
            <>
              <div className="payments-table-container">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPayments.length > 0 ? (
                      currentPayments.map((payment) => (
                        <tr key={payment._id}>
                          <td>{payment._id.substring(0, 8)}...</td>
                          <td>{payment.orderId.substring(0, 8)}...</td>
                          <td>{formatDate(payment.createdAt)}</td>
                          <td>{formatCurrency(payment.amount)}</td>
                          <td>{payment.paymentMethod}</td>
                          <td>
                            <span
                              className={`status-badge ${getStatusChipClass(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => viewPaymentDetails(payment)}
                              className="view-details-btn"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-payments-found">
                          No payments found with the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment Pagination Controls */}
              {payments.length > 0 && (
                <div className="pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="page-btn"
                  >
                    Previous
                  </button>

                  <div className="page-numbers">
                    {[...Array(totalPaymentPages).keys()].map((number) => (
                      <button
                        key={number + 1}
                        onClick={() => paginate(number + 1)}
                        className={`page-number ${
                          currentPage === number + 1 ? "active" : ""
                        }`}
                      >
                        {number + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPaymentPages}
                    className="page-btn"
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="payment-stats">
                <p>Total Payments: {payments.length}</p>
                <p>
                  Showing {payments.length > 0 ? indexOfFirstPayment + 1 : 0} -{" "}
                  {Math.min(indexOfLastPayment, payments.length)} of{" "}
                  {payments.length}
                </p>
              </div>
            </>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="order-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="order-info-grid">
              <div className="order-info-section">
                <h3>Order Information</h3>
                <p>
                  <strong>Order ID:</strong> {selectedOrder._id}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
                </p>
                <p>
                  <strong>Status:</strong> {selectedOrder.status}
                </p>
                <p>
                  <strong>Restaurant ID:</strong> {selectedOrder.restaurantId}
                </p>
                <p>
                  <strong>Total:</strong> ${selectedOrder.total.toFixed(2)}
                </p>
              </div>

              <div className="order-info-section">
                <h3>Customer Information</h3>
                <p>
                  <strong>User ID:</strong> {selectedOrder.userId}
                </p>
                <p>
                  <strong>Delivery Address:</strong>
                </p>
                <p className="address-details">
                  {selectedOrder.deliveryAddress.street}
                  <br />
                  {selectedOrder.deliveryAddress.city},{" "}
                  {selectedOrder.deliveryAddress.state}{" "}
                  {selectedOrder.deliveryAddress.zipCode}
                </p>
              </div>
            </div>

            <div className="order-items-section">
              <h3>Order Items</h3>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="total-label">
                      Order Total
                    </td>
                    <td className="total-value">
                      ${selectedOrder.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="modal-actions">
              <button
                className="update-status-btn"
                onClick={() => {
                  const newStatus = prompt(
                    "Enter new status (PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, REJECTED):",
                    selectedOrder.status
                  );
                  if (newStatus && newStatus !== selectedOrder.status) {
                    handleUpdateStatus(selectedOrder._id, newStatus);
                    setSelectedOrder({ ...selectedOrder, status: newStatus });
                  }
                }}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="payment-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Payment Details</h2>
              <button className="close-button" onClick={closePaymentModal}>
                ×
              </button>
            </div>
            <div className="payment-info-grid">
              <div className="payment-info-section">
                <h3>Payment Information</h3>
                <p>
                  <strong>Payment ID:</strong> {selectedPayment._id}
                </p>
                <p>
                  <strong>Order ID:</strong> {selectedPayment.orderId}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(selectedPayment.createdAt)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-badge ${getStatusChipClass(
                      selectedPayment.status
                    )}`}
                  >
                    {selectedPayment.status}
                  </span>
                </p>
                <p>
                  <strong>Amount:</strong>{" "}
                  {formatCurrency(selectedPayment.amount)}
                </p>
                <p>
                  <strong>Payment Method:</strong>{" "}
                  {selectedPayment.paymentMethod}
                </p>
                <p>
                  <strong>Transaction ID:</strong>{" "}
                  {selectedPayment.transactionId}
                </p>
              </div>

              <div className="payment-info-section">
                <h3>Additional Details</h3>
                {selectedPayment.paymentMethod === "CARD" && (
                  <>
                    <p>
                      <strong>Stripe Payment Intent ID:</strong>{" "}
                      {selectedPayment.stripePaymentIntentId || "N/A"}
                    </p>
                    <p>
                      <strong>Stripe Customer ID:</strong>{" "}
                      {selectedPayment.stripeCustomerId || "N/A"}
                    </p>
                  </>
                )}
                {selectedPayment.paymentMethod === "PAYPAL" && (
                  <>
                    <p>
                      <strong>PayPal Order ID:</strong>{" "}
                      {selectedPayment.paypalOrderId || "N/A"}
                    </p>
                    <p>
                      <strong>PayPal Payment ID:</strong>{" "}
                      {selectedPayment.paypalPaymentId || "N/A"}
                    </p>
                  </>
                )}
                <p>
                  <strong>User ID:</strong> {selectedPayment.userId}
                </p>
                {selectedPayment.error && (
                  <p className="error-message">
                    <strong>Error:</strong> {selectedPayment.error}
                  </p>
                )}
              </div>
            </div>

            <div className="payment-history-section">
              <h3>Payment Timeline</h3>
              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-date">
                    {formatDate(selectedPayment.createdAt)}
                  </span>
                  <span className="timeline-event">Payment created</span>
                </div>
                {selectedPayment.updatedAt &&
                  selectedPayment.updatedAt !== selectedPayment.createdAt && (
                    <div className="timeline-item">
                      <span className="timeline-date">
                        {formatDate(selectedPayment.updatedAt)}
                      </span>
                      <span className="timeline-event">
                        Payment updated to {selectedPayment.status}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
