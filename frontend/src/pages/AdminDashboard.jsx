import { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import "../styles/AdminDashboard.css";

// Icon components
const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ViewIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ToggleOnIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
    <circle cx="16" cy="12" r="3" />
  </svg>
);

const ToggleOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="5" width="22" height="14" rx="7" ry="7" />
    <circle cx="8" cy="12" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="loading">
    <div className="loading-spinner"></div>
    <p>Loading data...</p>
  </div>
);

// Empty State Component
const EmptyState = ({ message }) => (
  <div className="empty-message">
    {message || "No data found with the selected filters."}
  </div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    if (!status) return "";

    const statusLower = status.toLowerCase();
    if (statusLower === "pending") return "status-pending";
    if (statusLower === "completed" || statusLower === "confirmed")
      return "status-completed";
    if (statusLower === "preparing") return "status-preparing";
    if (statusLower === "out_for_delivery") return "status-out_for_delivery";
    if (statusLower === "delivered") return "status-delivered";
    if (statusLower === "rejected" || statusLower === "failed")
      return "status-failed";
    return "";
  };

  return (
    <span className={`status-badge ${getStatusClass(status)}`}>{status}</span>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("orders");

  // Payment filter states
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });

  // Payment CRUD states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [paymentEditMode, setPaymentEditMode] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    paymentId: null,
  });
  const [paymentForm, setPaymentForm] = useState({
    orderId: "",
    amount: "",
    paymentMethod: "CARD",
    status: "PENDING",
    userId: "",
    transactionId: "",
    stripePaymentIntentId: "",
    stripeCustomerId: "",
    paypalOrderId: "",
    paypalPaymentId: "",
  });

  // Payment Pagination states
  const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);
  const [paymentsPerPage] = useState(10);
  const indexOfLastPayment = paymentCurrentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const [payments, setPayments] = useState([]);
  const currentPayments = payments.slice(
    indexOfFirstPayment,
    indexOfLastPayment
  );
  const totalPaymentPages = Math.ceil(payments.length / paymentsPerPage);

  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [restaurantFilters, setRestaurantFilters] = useState({
    name: "",
    cuisine: "all",
    status: "all",
  });

  // Orders pagination states
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const indexOfLastOrder = orderCurrentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalOrderPages = Math.ceil(orders.length / itemsPerPage);

  // Restaurants pagination states
  const [restaurantCurrentPage, setRestaurantCurrentPage] = useState(1);
  const indexOfLastRestaurant = restaurantCurrentPage * itemsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - itemsPerPage;
  const currentRestaurants = restaurants.slice(
    indexOfFirstRestaurant,
    indexOfLastRestaurant
  );
  const totalRestaurantPages = Math.ceil(restaurants.length / itemsPerPage);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState({});

  const { serviceUrls, handleApiCall } = useApi();
  const { showToast } = useToast();

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "payments") {
      fetchPayments();
    } else if (activeTab === "restaurants") {
      fetchRestaurants();
    }
  }, [
    activeTab,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    restaurantFilters,
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
      setOrders([]);
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

  const fetchRestaurants = async () => {
    try {
      setLoading(true);

      // Build query parameters
      let queryParams = new URLSearchParams();

      if (restaurantFilters.name) {
        queryParams.append("name", restaurantFilters.name);
      }

      if (restaurantFilters.cuisine !== "all") {
        queryParams.append("cuisine", restaurantFilters.cuisine);
      }

      // Don't filter by status in API call, we'll filter client-side
      // since the API doesn't support this directly

      const response = await handleApiCall(
        fetch(
          `${serviceUrls.restaurant}/api/restaurants?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "x-admin-auth": "true",
            },
          }
        )
      );

      // Filter by status client-side if needed
      let restaurantData = response.data;
      if (restaurantFilters.status !== "all") {
        const active = restaurantFilters.status === "active";
        restaurantData = restaurantData.filter(
          (restaurant) => restaurant.isActive === active
        );
      }

      setRestaurants(restaurantData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      showToast(
        "Failed to fetch restaurants. Please ensure you have admin access.",
        "error"
      );
      setLoading(false);
      setRestaurants([]); // Reset to empty array on error
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

      // If the order is currently being viewed in the modal, update it there too
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Failed to update order status", "error");
    }
  };

  const handleUpdateRestaurantStatus = async (restaurantId, isActive) => {
    try {
      await handleApiCall(
        fetch(`${serviceUrls.restaurant}/api/restaurant/${restaurantId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-admin-auth": "true",
          },
          body: JSON.stringify({ isActive }),
        })
      );

      showToast(
        `Restaurant ${isActive ? "activated" : "deactivated"} successfully`,
        "success"
      );

      // Update the restaurant status in the local state
      setRestaurants(
        restaurants.map((restaurant) =>
          restaurant._id === restaurantId
            ? { ...restaurant, isActive }
            : restaurant
        )
      );

      // If we're in the modal, update the selected restaurant too
      if (selectedRestaurant && selectedRestaurant._id === restaurantId) {
        setSelectedRestaurant({ ...selectedRestaurant, isActive });
      }
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      showToast("Failed to update restaurant status", "error");
    }
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();

    try {
      await handleApiCall(
        fetch(
          `${serviceUrls.restaurant}/api/restaurant/${selectedRestaurant._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "x-admin-auth": "true",
            },
            body: JSON.stringify(restaurantForm),
          }
        )
      );

      showToast("Restaurant details updated successfully", "success");

      // Update local state
      const updatedRestaurant = { ...selectedRestaurant, ...restaurantForm };
      setSelectedRestaurant(updatedRestaurant);
      setRestaurants(
        restaurants.map((restaurant) =>
          restaurant._id === selectedRestaurant._id
            ? updatedRestaurant
            : restaurant
        )
      );

      // Exit edit mode
      setEditMode(false);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      showToast("Failed to update restaurant details", "error");
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

  const viewRestaurantDetails = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setRestaurantForm({ ...restaurant });
    setShowRestaurantModal(true);
    setEditMode(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  const closeRestaurantModal = () => {
    setShowRestaurantModal(false);
    setSelectedRestaurant(null);
    setEditMode(false);
  };

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

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const handleRestaurantFormChange = (e) => {
    const { name, value } = e.target;

    // Handle nested properties like address.city
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setRestaurantForm({
        ...restaurantForm,
        [parent]: {
          ...restaurantForm[parent],
          [child]: value,
        },
      });
    } else {
      setRestaurantForm({ ...restaurantForm, [name]: value });
    }
  };

  // Payment CRUD operations
  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm({ ...paymentForm, [name]: value });
  };

  const handleSubmitPaymentForm = async (e) => {
    e.preventDefault();

    try {
      if (paymentEditMode) {
        await updatePayment();
      } else {
        await createPayment();
      }
    } catch (error) {
      console.error("Error submitting payment form:", error);
      showToast("Error submitting payment form", "error");
    }
  };

  const createPayment = async () => {
    try {
      setLoading(true);

      const response = await handleApiCall(
        fetch(`${serviceUrls.payment}/api/payment/admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-admin-auth": "true",
          },
          body: JSON.stringify(paymentForm),
        })
      );

      showToast("Payment created successfully", "success");

      // Add new payment to state
      setPayments([response.data, ...payments]);

      // Close modal and reset form
      setShowNewPaymentModal(false);
      setPaymentForm({
        orderId: "",
        amount: "",
        paymentMethod: "CARD",
        status: "PENDING",
        userId: "",
        transactionId: "",
        stripePaymentIntentId: "",
        stripeCustomerId: "",
        paypalOrderId: "",
        paypalPaymentId: "",
      });

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error creating payment:", error);
      showToast("Failed to create payment", "error");
    }
  };

  const updatePayment = async () => {
    try {
      setLoading(true);

      await handleApiCall(
        fetch(
          `${serviceUrls.payment}/api/payment/admin/${selectedPayment._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "x-admin-auth": "true",
            },
            body: JSON.stringify(paymentForm),
          }
        )
      );

      showToast("Payment updated successfully", "success");

      // Update payment in state
      setPayments(
        payments.map((payment) =>
          payment._id === selectedPayment._id
            ? { ...payment, ...paymentForm }
            : payment
        )
      );

      // Close modal and reset edit mode
      setShowPaymentModal(false);
      setPaymentEditMode(false);
      setSelectedPayment(null);

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error updating payment:", error);
      showToast("Failed to update payment", "error");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      setLoading(true);

      await handleApiCall(
        fetch(`${serviceUrls.payment}/api/payment/admin/${paymentId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-admin-auth": "true",
          },
        })
      );

      showToast("Payment deleted successfully", "success");

      // Remove deleted payment from state
      setPayments(payments.filter((payment) => payment._id !== paymentId));

      // Close confirmation modal
      setDeleteConfirmation({ show: false, paymentId: null });

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error deleting payment:", error);
      showToast("Failed to delete payment", "error");
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      await handleApiCall(
        fetch(`${serviceUrls.payment}/api/payment/admin/${paymentId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "x-admin-auth": "true",
          },
          body: JSON.stringify({ status: newStatus }),
        })
      );

      showToast(`Payment status updated to ${newStatus}`, "success");

      // Update payment status in state
      setPayments(
        payments.map((payment) =>
          payment._id === paymentId
            ? { ...payment, status: newStatus }
            : payment
        )
      );

      // If the payment is being viewed in modal, update there too
      if (selectedPayment && selectedPayment._id === paymentId) {
        setSelectedPayment({ ...selectedPayment, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      showToast("Failed to update payment status", "error");
    }
  };

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, paginate }) => {
    return (
      <div className="pagination">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="page-btn"
        >
          Previous
        </button>

        <div className="page-numbers">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="page-btn"
        >
          Next
        </button>
      </div>
    );
  };

  // Stats bar component
  const StatsBar = ({ total, showingFrom, showingTo }) => {
    return (
      <div className="stats-bar">
        <p>Total: {total}</p>
        <p>
          Showing {total > 0 ? showingFrom : 0} - {Math.min(showingTo, total)}{" "}
          of {total}
        </p>
      </div>
    );
  };

  // Render the Orders Tab content
  const renderOrdersTab = () => (
    <>
      <h2>Order Management</h2>
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
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
          <label>Date Range</label>
          <div className="date-inputs">
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, startDate: e.target.value })
              }
              aria-label="Start date"
            />
            <span>to</span>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, endDate: e.target.value })
              }
              aria-label="End date"
            />
          </div>
        </div>

        <button
          className="refresh-btn"
          onClick={fetchOrders}
          aria-label="Refresh orders"
        >
          <RefreshIcon /> Refresh
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
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
                      <td>{formatCurrency(order.total)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="btn btn-secondary"
                            aria-label="View order details"
                          >
                            <ViewIcon /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <EmptyState message="No orders found with the selected filters." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {orders.length > 0 && (
            <PaginationControls
              currentPage={orderCurrentPage}
              totalPages={totalOrderPages}
              paginate={setOrderCurrentPage}
            />
          )}

          <StatsBar
            total={orders.length}
            showingFrom={indexOfFirstOrder + 1}
            showingTo={indexOfLastOrder}
          />
        </>
      )}
    </>
  );

  // Render the Payments Tab content
  const renderPaymentsTab = () => (
    <>
      <h2>Payment Management</h2>
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="payment-status-filter">Payment Status</label>
          <select
            id="payment-status-filter"
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
          <label htmlFor="payment-method-filter">Payment Method</label>
          <select
            id="payment-method-filter"
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
          <label>Date Range</label>
          <div className="date-inputs">
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, startDate: e.target.value })
              }
              aria-label="Start date"
            />
            <span>to</span>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, endDate: e.target.value })
              }
              aria-label="End date"
            />
          </div>
        </div>

        <button
          className="refresh-btn"
          onClick={fetchPayments}
          aria-label="Refresh payments"
        >
          <RefreshIcon /> Refresh
        </button>

        <button
          className="btn btn-primary"
          onClick={() => {
            setShowNewPaymentModal(true);
            setPaymentForm({
              orderId: "",
              amount: "",
              paymentMethod: "CARD",
              status: "PENDING",
              userId: "",
              transactionId: "",
              stripePaymentIntentId: "",
              stripeCustomerId: "",
              paypalOrderId: "",
              paypalPaymentId: "",
            });
          }}
        >
          + Add Payment
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
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
                        <StatusBadge status={payment.status} />
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => viewPaymentDetails(payment)}
                            className="btn btn-secondary"
                            aria-label="View payment details"
                          >
                            <ViewIcon /> View
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setPaymentForm(payment);
                              setPaymentEditMode(true);
                              setShowPaymentModal(true);
                            }}
                            className="btn btn-primary"
                            aria-label="Edit payment"
                          >
                            <EditIcon /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmation({
                                show: true,
                                paymentId: payment._id,
                              });
                            }}
                            className="btn btn-danger"
                            aria-label="Delete payment"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <EmptyState message="No payments found with the selected filters." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {payments.length > 0 && (
            <PaginationControls
              currentPage={paymentCurrentPage}
              totalPages={totalPaymentPages}
              paginate={setPaymentCurrentPage}
            />
          )}

          <StatsBar
            total={payments.length}
            showingFrom={indexOfFirstPayment + 1}
            showingTo={indexOfLastPayment}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmation.show}
        onClose={() => setDeleteConfirmation({ show: false, paymentId: null })}
        title="Confirm Deletion"
      >
        <div className="confirmation-modal">
          <p>Are you sure you want to delete this payment record?</p>
          <p className="warning">This action cannot be undone.</p>
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() =>
                setDeleteConfirmation({ show: false, paymentId: null })
              }
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleDeletePayment(deleteConfirmation.paymentId)}
            >
              Delete Payment
            </button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Payment Modal */}
      {renderPaymentDetailsModal()}
    </>
  );

  // Render the Restaurants Tab content
  const renderRestaurantsTab = () => (
    <>
      <h2>Restaurant Management</h2>
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="restaurant-name-filter">Name Search</label>
          <div className="search-input-wrapper">
            <input
              id="restaurant-name-filter"
              type="text"
              placeholder="Search by name..."
              value={restaurantFilters.name}
              onChange={(e) =>
                setRestaurantFilters({
                  ...restaurantFilters,
                  name: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="cuisine-filter">Cuisine</label>
          <select
            id="cuisine-filter"
            value={restaurantFilters.cuisine}
            onChange={(e) =>
              setRestaurantFilters({
                ...restaurantFilters,
                cuisine: e.target.value,
              })
            }
          >
            <option value="all">All Cuisines</option>
            <option value="Italian">Italian</option>
            <option value="Chinese">Chinese</option>
            <option value="Indian">Indian</option>
            <option value="Mexican">Mexican</option>
            <option value="Japanese">Japanese</option>
            <option value="American">American</option>
            <option value="Thai">Thai</option>
            <option value="Mediterranean">Mediterranean</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={restaurantFilters.status}
            onChange={(e) =>
              setRestaurantFilters({
                ...restaurantFilters,
                status: e.target.value,
              })
            }
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button
          className="refresh-btn"
          onClick={fetchRestaurants}
          aria-label="Refresh restaurants"
        >
          <RefreshIcon /> Refresh
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Restaurant ID</th>
                  <th>Name</th>
                  <th>Cuisine</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Added Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRestaurants.length > 0 ? (
                  currentRestaurants.map((restaurant) => (
                    <tr key={restaurant._id}>
                      <td>{restaurant._id.substring(0, 8)}...</td>
                      <td>{restaurant.name}</td>
                      <td>{restaurant.cuisine}</td>
                      <td>{`${restaurant.address.city}, ${restaurant.address.state}`}</td>
                      <td>
                        <StatusBadge
                          status={restaurant.isActive ? "Active" : "Inactive"}
                        />
                      </td>
                      <td>{restaurant.rating?.toFixed(1) || "N/A"}</td>
                      <td>{formatDate(restaurant.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => viewRestaurantDetails(restaurant)}
                            className="btn btn-secondary"
                            aria-label="View restaurant details"
                          >
                            <ViewIcon /> View
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateRestaurantStatus(
                                restaurant._id,
                                !restaurant.isActive
                              )
                            }
                            className={`btn ${
                              restaurant.isActive ? "btn-danger" : "btn-success"
                            }`}
                            aria-label={
                              restaurant.isActive
                                ? "Deactivate restaurant"
                                : "Activate restaurant"
                            }
                          >
                            {restaurant.isActive ? (
                              <>
                                <ToggleOffIcon /> Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleOnIcon /> Activate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      <EmptyState message="No restaurants found with the selected filters." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {restaurants.length > 0 && (
            <PaginationControls
              currentPage={restaurantCurrentPage}
              totalPages={totalRestaurantPages}
              paginate={setRestaurantCurrentPage}
            />
          )}

          <StatsBar
            total={restaurants.length}
            showingFrom={indexOfFirstRestaurant + 1}
            showingTo={indexOfLastRestaurant}
          />
        </>
      )}
    </>
  );

  // Render the Order Details Modal content
  const renderOrderDetailsContent = () => {
    if (!selectedOrder) return null;

    return (
      <>
        <div className="info-grid">
          <div className="info-section">
            <h3>Order Information</h3>
            <p>
              <strong>Order ID:</strong> {selectedOrder._id}
            </p>
            <p>
              <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <StatusBadge status={selectedOrder.status} />
            </p>
            <p>
              <strong>Restaurant:</strong> {selectedOrder.restaurantId}
            </p>
            <p>
              <strong>Total:</strong> {formatCurrency(selectedOrder.total)}
            </p>
          </div>

          <div className="info-section">
            <h3>Customer Information</h3>
            <p>
              <strong>User ID:</strong> {selectedOrder.userId}
            </p>
            <p>
              <strong>Delivery Address:</strong>
            </p>
            <div className="address-details">
              {selectedOrder.deliveryAddress.street}
              <br />
              {selectedOrder.deliveryAddress.city},{" "}
              {selectedOrder.deliveryAddress.state}{" "}
              {selectedOrder.deliveryAddress.zipCode}
            </div>
          </div>
        </div>

        <div className="additional-section">
          <h3>Order Items</h3>
          <div className="table-container">
            <table className="data-table">
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
                    <td>{formatCurrency(item.price)}</td>
                    <td>{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" style={{ textAlign: "right" }}>
                    <strong>Order Total:</strong>
                  </td>
                  <td>
                    <strong>{formatCurrency(selectedOrder.total)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="form-actions">
          <div className="filter-group" style={{ marginRight: "auto" }}>
            <label htmlFor="update-status">Update Status</label>
            <select
              id="update-status"
              value={selectedOrder.status}
              onChange={(e) =>
                handleUpdateStatus(selectedOrder._id, e.target.value)
              }
              className="status-select"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </>
    );
  };

  // Render the Restaurant Details Modal content
  const renderRestaurantDetailsContent = () => {
    if (!selectedRestaurant) return null;

    if (!editMode) {
      return (
        <>
          <div className="info-grid">
            <div className="info-section">
              <h3>Basic Information</h3>
              <p>
                <strong>Restaurant ID:</strong> {selectedRestaurant._id}
              </p>
              <p>
                <strong>Name:</strong> {selectedRestaurant.name}
              </p>
              <p>
                <strong>Cuisine:</strong> {selectedRestaurant.cuisine}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <StatusBadge
                  status={selectedRestaurant.isActive ? "Active" : "Inactive"}
                />
              </p>
              <p>
                <strong>Rating:</strong>{" "}
                {selectedRestaurant.rating?.toFixed(1) || "N/A"} / 5
              </p>
              <p>
                <strong>Added Date:</strong>{" "}
                {formatDate(selectedRestaurant.createdAt)}
              </p>
              <p>
                <strong>Last Updated:</strong>{" "}
                {formatDate(selectedRestaurant.updatedAt)}
              </p>
            </div>

            <div className="info-section">
              <h3>Location & Contact</h3>
              <p>
                <strong>Address:</strong>
              </p>
              <div className="address-details">
                {selectedRestaurant.address.street}
                <br />
                {selectedRestaurant.address.city},{" "}
                {selectedRestaurant.address.state}{" "}
                {selectedRestaurant.address.zipCode}
                <br />
                {selectedRestaurant.address.country}
              </div>
              <p>
                <strong>Phone:</strong> {selectedRestaurant.phone}
              </p>
              <p>
                <strong>Email:</strong> {selectedRestaurant.email || "N/A"}
              </p>
              <p>
                <strong>Website:</strong> {selectedRestaurant.website || "N/A"}
              </p>
              <p>
                <strong>Owner ID:</strong> {selectedRestaurant.ownerId}
              </p>
            </div>
          </div>

          <div className="additional-section">
            <h3>Description</h3>
            <p>
              {selectedRestaurant.description || "No description available."}
            </p>
          </div>

          {selectedRestaurant.openingHours && (
            <div className="additional-section">
              <h3>Opening Hours</h3>
              <div className="hours-grid">
                {Object.entries(selectedRestaurant.openingHours).map(
                  ([day, hours]) => (
                    <div key={day} className="hours-row">
                      <span className="day">{day}:</span>
                      <span className="hours">{hours || "Closed"}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="additional-section">
            <h3>Menu</h3>
            <p>{selectedRestaurant.menu?.length || 0} items available</p>
          </div>

          <div className="form-actions">
            <button
              onClick={() =>
                handleUpdateRestaurantStatus(
                  selectedRestaurant._id,
                  !selectedRestaurant.isActive
                )
              }
              className={`btn ${
                selectedRestaurant.isActive ? "btn-danger" : "btn-success"
              }`}
            >
              {selectedRestaurant.isActive ? (
                <>
                  <ToggleOffIcon /> Deactivate Restaurant
                </>
              ) : (
                <>
                  <ToggleOnIcon /> Activate Restaurant
                </>
              )}
            </button>
            <button
              onClick={() => setEditMode(true)}
              className="btn btn-primary"
            >
              <EditIcon /> Edit Details
            </button>
          </div>
        </>
      );
    } else {
      return (
        <form onSubmit={handleSaveRestaurant} className="restaurant-edit-form">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="restaurant-name">Restaurant Name</label>
                <input
                  id="restaurant-name"
                  type="text"
                  name="name"
                  value={restaurantForm.name || ""}
                  onChange={handleRestaurantFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="restaurant-cuisine">Cuisine</label>
                <select
                  id="restaurant-cuisine"
                  name="cuisine"
                  value={restaurantForm.cuisine || ""}
                  onChange={handleRestaurantFormChange}
                  required
                >
                  <option value="Italian">Italian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Indian">Indian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Japanese">Japanese</option>
                  <option value="American">American</option>
                  <option value="Thai">Thai</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="restaurant-phone">Phone</label>
                <input
                  id="restaurant-phone"
                  type="text"
                  name="phone"
                  value={restaurantForm.phone || ""}
                  onChange={handleRestaurantFormChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="restaurant-email">Email</label>
                <input
                  id="restaurant-email"
                  type="email"
                  name="email"
                  value={restaurantForm.email || ""}
                  onChange={handleRestaurantFormChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="restaurant-website">Website</label>
                <input
                  id="restaurant-website"
                  type="text"
                  name="website"
                  value={restaurantForm.website || ""}
                  onChange={handleRestaurantFormChange}
                />
              </div>
            </div>

            <div className="form-column">
              <div className="form-group">
                <label htmlFor="restaurant-description">Description</label>
                <textarea
                  id="restaurant-description"
                  name="description"
                  value={restaurantForm.description || ""}
                  onChange={handleRestaurantFormChange}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="restaurant-street">Street Address</label>
                <input
                  id="restaurant-street"
                  type="text"
                  name="address.street"
                  value={restaurantForm.address?.street || ""}
                  onChange={handleRestaurantFormChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="restaurant-city">City</label>
                <input
                  id="restaurant-city"
                  type="text"
                  name="address.city"
                  value={restaurantForm.address?.city || ""}
                  onChange={handleRestaurantFormChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="restaurant-state">State</label>
                <input
                  id="restaurant-state"
                  type="text"
                  name="address.state"
                  value={restaurantForm.address?.state || ""}
                  onChange={handleRestaurantFormChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="restaurant-zip">Zip Code</label>
                <input
                  id="restaurant-zip"
                  type="text"
                  name="address.zipCode"
                  value={restaurantForm.address?.zipCode || ""}
                  onChange={handleRestaurantFormChange}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Changes
            </button>
          </div>
        </form>
      );
    }
  };

  // Render the Payment Details Modal and Create/Edit Payment Modal
  const renderPaymentDetailsModal = () => {
    const isEditMode = paymentEditMode && selectedPayment;
    const isNewMode = showNewPaymentModal;
    const isViewMode = showPaymentModal && selectedPayment && !paymentEditMode;

    // Form modal (Create/Edit)
    if (isEditMode || isNewMode) {
      return (
        <Modal
          isOpen={isEditMode || isNewMode}
          onClose={() => {
            setShowPaymentModal(false);
            setShowNewPaymentModal(false);
            setPaymentEditMode(false);
            setSelectedPayment(null);
          }}
          title={isEditMode ? "Edit Payment" : "Create New Payment"}
        >
          <form onSubmit={handleSubmitPaymentForm} className="payment-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="orderId">Order ID</label>
                <input
                  type="text"
                  id="orderId"
                  name="orderId"
                  value={paymentForm.orderId}
                  onChange={handlePaymentFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="userId">User ID</label>
                <input
                  type="text"
                  id="userId"
                  name="userId"
                  value={paymentForm.userId}
                  onChange={handlePaymentFormChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount ($)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={handlePaymentFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={paymentForm.paymentMethod}
                  onChange={handlePaymentFormChange}
                  required
                >
                  <option value="CARD">Credit Card</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={paymentForm.status}
                  onChange={handlePaymentFormChange}
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="transactionId">Transaction ID</label>
                <input
                  type="text"
                  id="transactionId"
                  name="transactionId"
                  value={paymentForm.transactionId}
                  onChange={handlePaymentFormChange}
                />
              </div>
            </div>

            {/* Payment provider specific fields - conditionally rendered */}
            {paymentForm.paymentMethod === "CARD" && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="stripePaymentIntentId">
                    Stripe Payment Intent ID
                  </label>
                  <input
                    type="text"
                    id="stripePaymentIntentId"
                    name="stripePaymentIntentId"
                    value={paymentForm.stripePaymentIntentId}
                    onChange={handlePaymentFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="stripeCustomerId">Stripe Customer ID</label>
                  <input
                    type="text"
                    id="stripeCustomerId"
                    name="stripeCustomerId"
                    value={paymentForm.stripeCustomerId}
                    onChange={handlePaymentFormChange}
                  />
                </div>
              </div>
            )}

            {paymentForm.paymentMethod === "PAYPAL" && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paypalOrderId">PayPal Order ID</label>
                  <input
                    type="text"
                    id="paypalOrderId"
                    name="paypalOrderId"
                    value={paymentForm.paypalOrderId}
                    onChange={handlePaymentFormChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="paypalPaymentId">PayPal Payment ID</label>
                  <input
                    type="text"
                    id="paypalPaymentId"
                    name="paypalPaymentId"
                    value={paymentForm.paypalPaymentId}
                    onChange={handlePaymentFormChange}
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowNewPaymentModal(false);
                  setPaymentEditMode(false);
                  setSelectedPayment(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {isEditMode ? "Update Payment" : "Create Payment"}
              </button>
            </div>
          </form>
        </Modal>
      );
    }

    // View payment details modal
    if (isViewMode) {
      return (
        <Modal
          isOpen={showPaymentModal}
          onClose={closePaymentModal}
          title="Payment Details"
        >
          <div className="info-grid">
            <div className="info-section">
              <h3>Payment Information</h3>
              <p>
                <strong>Payment ID:</strong> {selectedPayment._id}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(selectedPayment.createdAt)}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <StatusBadge status={selectedPayment.status} />
              </p>
              <p>
                <strong>Method:</strong> {selectedPayment.paymentMethod}
              </p>
              <p>
                <strong>Amount:</strong>{" "}
                {formatCurrency(selectedPayment.amount)}
              </p>
            </div>

            <div className="info-section">
              <h3>Related Information</h3>
              <p>
                <strong>Order ID:</strong> {selectedPayment.orderId}
              </p>
              <p>
                <strong>User ID:</strong> {selectedPayment.userId}
              </p>
              <p>
                <strong>Transaction ID:</strong>{" "}
                {selectedPayment.transactionId || "N/A"}
              </p>
            </div>
          </div>

          {/* Additional payment provider details */}
          <div className="additional-section">
            <h3>Payment Provider Details</h3>
            {selectedPayment.paymentMethod === "CARD" && (
              <div className="provider-details">
                <p>
                  <strong>Stripe Payment Intent ID:</strong>{" "}
                  {selectedPayment.stripePaymentIntentId || "N/A"}
                </p>
                <p>
                  <strong>Stripe Customer ID:</strong>{" "}
                  {selectedPayment.stripeCustomerId || "N/A"}
                </p>
              </div>
            )}

            {selectedPayment.paymentMethod === "PAYPAL" && (
              <div className="provider-details">
                <p>
                  <strong>PayPal Order ID:</strong>{" "}
                  {selectedPayment.paypalOrderId || "N/A"}
                </p>
                <p>
                  <strong>PayPal Payment ID:</strong>{" "}
                  {selectedPayment.paypalPaymentId || "N/A"}
                </p>
              </div>
            )}
          </div>

          <div className="form-actions">
            <div className="filter-group" style={{ marginRight: "auto" }}>
              <label htmlFor="update-payment-status">Update Status</label>
              <select
                id="update-payment-status"
                value={selectedPayment.status}
                onChange={(e) =>
                  updatePaymentStatus(selectedPayment._id, e.target.value)
                }
                className="status-select"
              >
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => {
                setPaymentForm(selectedPayment);
                setPaymentEditMode(true);
              }}
            >
              <EditIcon /> Edit Payment
            </button>
          </div>
        </Modal>
      );
    }

    return null;
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("orders");
            setCurrentPage(1);
          }}
        >
          Order Management
        </button>
        <button
          className={`tab-button ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("payments");
            setCurrentPage(1);
          }}
        >
          Payment Management
        </button>
        <button
          className={`tab-button ${
            activeTab === "restaurants" ? "active" : ""
          }`}
          onClick={() => {
            setActiveTab("restaurants");
            setCurrentPage(1);
          }}
        >
          Restaurant Management
        </button>
      </div>

      {/* Render tab content based on activeTab */}
      {activeTab === "orders" && renderOrdersTab()}
      {activeTab === "payments" && renderPaymentsTab()}
      {activeTab === "restaurants" && renderRestaurantsTab()}

      {/* Order Details Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title="Order Details">
        {renderOrderDetailsContent()}
      </Modal>

      {/* Restaurant Details Modal */}
      <Modal
        isOpen={showRestaurantModal}
        onClose={closeRestaurantModal}
        title={editMode ? "Edit Restaurant" : "Restaurant Details"}
      >
        {renderRestaurantDetailsContent()}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
