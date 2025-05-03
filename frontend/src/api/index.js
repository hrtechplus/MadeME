import axios from "axios";

// Get the API Gateway URL from environment variables or use default
const API_GATEWAY_URL =
  import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:80";

// Create a single axios instance for all services through the API Gateway
const apiClient = axios.create({
  baseURL: API_GATEWAY_URL,
  timeout: 5000,
});

// Add request interceptor to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;

    // Check if user is admin and add the special header for dev mode
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData && userData.role === "admin") {
        config.headers["x-admin-auth"] = "true";
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }
  return config;
};

// Add response interceptor for error handling
const handleError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error("API Error:", error.response.data);
    return Promise.reject(error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    console.error("Network Error:", error.request);
    return Promise.reject({
      message: "Network error. Please check your connection.",
    });
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error("Error:", error.message);
    return Promise.reject({ message: error.message });
  }
};

apiClient.interceptors.request.use(addAuthToken);
apiClient.interceptors.response.use((response) => response, handleError);

// Cart API functions
export const cartApi = {
  getCart: (userId) => apiClient.get(`/api/cart/${userId}`),
  addToCart: (data) => apiClient.post("/api/cart/add", data),
  updateItemQuantity: (userId, itemId, quantity) =>
    apiClient.put(`/api/cart/${userId}/${itemId}`, { quantity }),
  removeItem: (userId, itemId) =>
    apiClient.delete(`/api/cart/${userId}/${itemId}`),
  clearCart: (userId) => apiClient.delete(`/api/cart/${userId}`),
};

// Order API functions
export const orderApi = {
  createOrder: (data) => apiClient.post("/api/orders", data),
  getOrders: (userId) => apiClient.get(`/api/orders/user/${userId}`),
  getOrder: (orderId) => apiClient.get(`/api/orders/${orderId}`),
  trackOrder: (orderId) => apiClient.get(`/api/orders/${orderId}/track`),
  updateOrderStatus: (orderId, status) =>
    apiClient.patch(`/api/orders/${orderId}/status`, { status }),
  getRestaurantOrders: (restaurantId) =>
    apiClient.get(`/api/orders/restaurant/${restaurantId}`),
  assignDriver: (orderId, driverId) =>
    apiClient.post(`/api/orders/${orderId}/assign-driver`, { driverId }),
  // Admin-specific endpoints
  getAllOrders: (filters = {}) =>
    apiClient.get("/api/orders/admin/all", { params: filters }),
  updateOrder: (orderId, orderData) =>
    apiClient.put(`/api/orders/${orderId}`, orderData),
  deleteOrder: (orderId) => apiClient.delete(`/api/orders/${orderId}`),
  cancelOrder: (orderId, cancellationReason) =>
    apiClient.post(`/api/orders/${orderId}/cancel`, { cancellationReason }),
  // Alternative order cancellation method (doesn't require auth token validation)
  userCancelOrder: (orderId, userId, cancellationReason) =>
    apiClient.post(`/api/orders/${orderId}/user-cancel`, {
      userId,
      cancellationReason,
    }),
};

// Payment API functions
export const paymentApi = {
  createPaymentIntent: (data) => apiClient.post("/api/payments/initiate", data),
  getPaymentStatus: (orderId) =>
    apiClient.get(`/api/payments/order/${orderId}`),
};

// Restaurant API functions
export const restaurantApi = {
  // Restaurant endpoints
  getAllRestaurants: (filters = {}) =>
    apiClient.get("/api/restaurants", { params: filters }),
  getRestaurantById: (restaurantId) =>
    apiClient.get(`/api/restaurants/${restaurantId}`),
  createRestaurant: (restaurantData) =>
    apiClient.post("/api/restaurants", restaurantData),
  updateRestaurant: (restaurantId, restaurantData) =>
    apiClient.put(`/api/restaurants/${restaurantId}`, restaurantData),
  deleteRestaurant: (restaurantId) =>
    apiClient.delete(`/api/restaurants/${restaurantId}`),
  getMyRestaurants: () => apiClient.get("/api/restaurants/owner/me"),

  // Menu endpoints
  getMenuItems: (restaurantId, category) =>
    apiClient.get(`/api/restaurants/${restaurantId}/menu`, {
      params: { category },
    }),
  getMenuItem: (restaurantId, menuItemId) =>
    apiClient.get(`/api/restaurants/${restaurantId}/menu/${menuItemId}`),
  addMenuItem: (restaurantId, menuItemData) =>
    apiClient.post(`/api/restaurants/${restaurantId}/menu`, menuItemData),
  updateMenuItem: (restaurantId, menuItemId, menuItemData) =>
    apiClient.put(
      `/api/restaurants/${restaurantId}/menu/${menuItemId}`,
      menuItemData
    ),
  deleteMenuItem: (restaurantId, menuItemId) =>
    apiClient.delete(`/api/restaurants/${restaurantId}/menu/${menuItemId}`),
};

// User API functions - adding these to complete the API client
export const userApi = {
  login: (credentials) => apiClient.post("/api/users/login", credentials),
  register: (userData) => apiClient.post("/api/users/register", userData),
  getProfile: () => apiClient.get("/api/users/profile"),
  updateProfile: (userData) => apiClient.put("/api/users/profile", userData),
  // Admin-specific endpoints
  getAllUsers: () => apiClient.get("/api/users/admin/all"),
  getUserById: (userId) => apiClient.get(`/api/users/${userId}`),
  updateUser: (userId, userData) =>
    apiClient.put(`/api/users/${userId}`, userData),
  deleteUser: (userId) => apiClient.delete(`/api/users/${userId}`),
};

// Export all APIs
export default {
  cart: cartApi,
  order: orderApi,
  payment: paymentApi,
  restaurant: restaurantApi,
  user: userApi,
};
