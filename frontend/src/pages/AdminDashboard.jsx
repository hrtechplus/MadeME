import { useState, useEffect, useContext } from 'react';
import { ApiContext } from '../context/ApiContext';
import { ToastContext } from '../context/ToastContext';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { api } = useContext(ApiContext);
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      let queryParams = new URLSearchParams();
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      if (dateFilter.startDate) {
        queryParams.append('startDate', dateFilter.startDate);
      }
      if (dateFilter.endDate) {
        queryParams.append('endDate', dateFilter.endDate);
      }
      
      const response = await api.get(`/api/orders/admin/all?${queryParams.toString()}`);
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to fetch orders', 'error');
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order status updated to ${newStatus}`, 'success');
      
      // Update the order status in the local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    }
  };

  // Pagination logic
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  return (
    <div className="admin-dashboard">
      <h1>Order Management Dashboard</h1>
      
      <div className="filters">
        <div className="filter-group">
          <label>Status Filter:</label>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivering">Delivering</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Date Range:</label>
          <div className="date-inputs">
            <input 
              type="date" 
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
              placeholder="Start Date"
            />
            <span>to</span>
            <input 
              type="date" 
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
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
                      <td>{order.user?.name || 'Guest'}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{order.items.length} items</td>
                      <td>${order.totalAmount.toFixed(2)}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          className={`status-select status-${order.status}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="delivering">Delivering</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <a 
                          href={`/admin/orders/${order._id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="view-details-btn"
                        >
                          View Details
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-orders">No orders found with the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
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
                {[...Array(totalPages).keys()].map(number => (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={`page-number ${currentPage === number + 1 ? 'active' : ''}`}
                  >
                    {number + 1}
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
          )}
          
          <div className="order-stats">
            <p>Total Orders: {orders.length}</p>
            <p>Showing {indexOfFirstOrder + 1} - {Math.min(indexOfLastOrder, orders.length)} of {orders.length}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;