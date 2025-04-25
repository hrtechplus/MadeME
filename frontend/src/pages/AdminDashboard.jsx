import { useState, useEffect } from "react";
import { useApi } from "../context/ApiContext";
import { useToast } from "../context/ToastContext";
import "../styles/AdminDashboard.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [restaurantFilters, setRestaurantFilters] = useState({
    name: "",
    cuisine: "all",
    status: "all",
  });
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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

      setRestaurants(restaurantData);
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

  // Pagination logic for restaurants
  const indexOfLastRestaurant = currentPage * itemsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - itemsPerPage;
  const currentRestaurants = restaurants.slice(
    indexOfFirstRestaurant,
    indexOfLastRestaurant
  );
  const totalRestaurantPages = Math.ceil(restaurants.length / itemsPerPage);

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

  const handleRestaurantFormChange = (e) => {
    const { name, value } = e.target;
    setRestaurantForm({ ...restaurantForm, [name]: value });
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
      ) : activeTab === "payments" ? (
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
      ) : (
        <>
          <h2>Restaurant Management</h2>
          <div className="filters">
            <div className="filter-group">
              <label>Name Search:</label>
              <input
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

            <div className="filter-group">
              <label>Cuisine:</label>
              <select
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
              <label>Status:</label>
              <select
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

            <button className="refresh-btn" onClick={fetchRestaurants}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading restaurants...</div>
          ) : (
            <>
              <div className="restaurants-table-container">
                <table className="restaurants-table">
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
                            <span
                              className={`status-badge ${
                                restaurant.isActive
                                  ? "status-completed"
                                  : "status-failed"
                              }`}
                            >
                              {restaurant.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>{restaurant.rating?.toFixed(1) || "N/A"}</td>
                          <td>{formatDate(restaurant.createdAt)}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() =>
                                  viewRestaurantDetails(restaurant)
                                }
                                className="view-details-btn"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() =>
                                  handleUpdateRestaurantStatus(
                                    restaurant._id,
                                    !restaurant.isActive
                                  )
                                }
                                className={`status-toggle-btn ${
                                  restaurant.isActive
                                    ? "deactivate"
                                    : "activate"
                                }`}
                              >
                                {restaurant.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="no-restaurants-found">
                          No restaurants found with the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Restaurant Pagination Controls */}
              {restaurants.length > 0 && (
                <div className="pagination">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="page-btn"
                  >
                    Previous
                  </button>

                  <div className="page-numbers">
                    {[...Array(totalRestaurantPages).keys()].map((number) => (
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
                    disabled={currentPage === totalRestaurantPages}
                    className="page-btn"
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="restaurant-stats">
                <p>Total Restaurants: {restaurants.length}</p>
                <p>
                  Showing{" "}
                  {restaurants.length > 0 ? indexOfFirstRestaurant + 1 : 0} -{" "}
                  {Math.min(indexOfLastRestaurant, restaurants.length)} of{" "}
                  {restaurants.length}
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

      {/* Restaurant Details Modal */}
      {showRestaurantModal && selectedRestaurant && (
        <div className="restaurant-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editMode ? "Edit Restaurant" : "Restaurant Details"}</h2>
              <button className="close-button" onClick={closeRestaurantModal}>
                ×
              </button>
            </div>

            {!editMode ? (
              <>
                <div className="restaurant-info-grid">
                  <div className="restaurant-info-section">
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
                      <strong>Status:</strong>
                      <span
                        className={`status-badge ${
                          selectedRestaurant.isActive
                            ? "status-completed"
                            : "status-failed"
                        }`}
                      >
                        {selectedRestaurant.isActive ? "Active" : "Inactive"}
                      </span>
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

                  <div className="restaurant-info-section">
                    <h3>Location & Contact</h3>
                    <p>
                      <strong>Address:</strong>
                    </p>
                    <p className="address-details">
                      {selectedRestaurant.address.street}
                      <br />
                      {selectedRestaurant.address.city},{" "}
                      {selectedRestaurant.address.state}{" "}
                      {selectedRestaurant.address.zipCode}
                      <br />
                      {selectedRestaurant.address.country}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedRestaurant.phone}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedRestaurant.email || "N/A"}
                    </p>
                    <p>
                      <strong>Website:</strong>{" "}
                      {selectedRestaurant.website || "N/A"}
                    </p>
                    <p>
                      <strong>Owner ID:</strong> {selectedRestaurant.ownerId}
                    </p>
                  </div>
                </div>

                <div className="restaurant-description-section">
                  <h3>Description</h3>
                  <p>
                    {selectedRestaurant.description ||
                      "No description available."}
                  </p>
                </div>

                <div className="restaurant-hours-section">
                  <h3>Opening Hours</h3>
                  {selectedRestaurant.openingHours ? (
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
                  ) : (
                    <p>No opening hours available.</p>
                  )}
                </div>

                <div className="restaurant-menu-summary">
                  <h3>Menu</h3>
                  <p>{selectedRestaurant.menu?.length || 0} items available</p>
                </div>

                <div className="modal-actions">
                  <button
                    className="update-status-btn"
                    onClick={() =>
                      handleUpdateRestaurantStatus(
                        selectedRestaurant._id,
                        !selectedRestaurant.isActive
                      )
                    }
                  >
                    {selectedRestaurant.isActive
                      ? "Deactivate Restaurant"
                      : "Activate Restaurant"}
                  </button>
                  <button
                    className="edit-restaurant-btn"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Details
                  </button>
                </div>
              </>
            ) : (
              <form
                onSubmit={handleSaveRestaurant}
                className="restaurant-edit-form"
              >
                <div className="form-grid">
                  <div className="form-column">
                    <div className="form-group">
                      <label>Restaurant Name:</label>
                      <input
                        type="text"
                        name="name"
                        value={restaurantForm.name || ""}
                        onChange={handleRestaurantFormChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Cuisine:</label>
                      <select
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
                      <label>Phone:</label>
                      <input
                        type="text"
                        name="phone"
                        value={restaurantForm.phone || ""}
                        onChange={handleRestaurantFormChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        name="email"
                        value={restaurantForm.email || ""}
                        onChange={handleRestaurantFormChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Website:</label>
                      <input
                        type="text"
                        name="website"
                        value={restaurantForm.website || ""}
                        onChange={handleRestaurantFormChange}
                      />
                    </div>
                  </div>

                  <div className="form-column">
                    <div className="form-group">
                      <label>Description:</label>
                      <textarea
                        name="description"
                        value={restaurantForm.description || ""}
                        onChange={handleRestaurantFormChange}
                        rows="3"
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label>Street Address:</label>
                      <input
                        type="text"
                        name="address.street"
                        value={restaurantForm.address?.street || ""}
                        onChange={(e) => {
                          const address = {
                            ...restaurantForm.address,
                            street: e.target.value,
                          };
                          setRestaurantForm({ ...restaurantForm, address });
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>City:</label>
                      <input
                        type="text"
                        name="address.city"
                        value={restaurantForm.address?.city || ""}
                        onChange={(e) => {
                          const address = {
                            ...restaurantForm.address,
                            city: e.target.value,
                          };
                          setRestaurantForm({ ...restaurantForm, address });
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>State:</label>
                      <input
                        type="text"
                        name="address.state"
                        value={restaurantForm.address?.state || ""}
                        onChange={(e) => {
                          const address = {
                            ...restaurantForm.address,
                            state: e.target.value,
                          };
                          setRestaurantForm({ ...restaurantForm, address });
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Zip Code:</label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={restaurantForm.address?.zipCode || ""}
                        onChange={(e) => {
                          const address = {
                            ...restaurantForm.address,
                            zipCode: e.target.value,
                          };
                          setRestaurantForm({ ...restaurantForm, address });
                        }}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
