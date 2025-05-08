const axios = require("axios");

class ServiceClient {
  constructor() {
    this.paymentServiceUrl =
      process.env.PAYMENT_SERVICE_URL || "http://payment-service:5003";
    this.restaurantServiceUrl =
      process.env.RESTAURANT_SERVICE_URL || "http://restaurant-service:5005";
    this.userServiceUrl =
      process.env.USER_SERVICE_URL || "http://user-service:5004";
    this.cartServiceUrl =
      process.env.CART_SERVICE_URL || "http://cart-service:5002";

    // Create axios instances for each service
    this.paymentService = axios.create({
      baseURL: this.paymentServiceUrl,
      timeout: 5000,
    });

    this.restaurantService = axios.create({
      baseURL: this.restaurantServiceUrl,
      timeout: 5000,
    });

    this.userService = axios.create({
      baseURL: this.userServiceUrl,
      timeout: 5000,
    });

    this.cartService = axios.create({
      baseURL: this.cartServiceUrl,
      timeout: 5000,
    });

    // Add response interceptors for error handling
    this.addErrorInterceptor(this.paymentService, "payment");
    this.addErrorInterceptor(this.restaurantService, "restaurant");
    this.addErrorInterceptor(this.userService, "user");
    this.addErrorInterceptor(this.cartService, "cart");
  }

  addErrorInterceptor(service, name) {
    service.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`Error calling ${name} service:`, error.message);
        if (error.response) {
          console.error(`${name} service error details:`, error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  // Payment Service Methods
  async createPaymentIntent(paymentData) {
    try {
      const response = await this.paymentService.post(
        "/api/payments/initiate",
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create payment intent:", error.message);
      throw error;
    }
  }

  async getPaymentStatus(orderId) {
    try {
      const response = await this.paymentService.get(
        `/api/payments/order/${orderId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get payment status for order ${orderId}:`,
        error.message
      );
      throw error;
    }
  }

  // Restaurant Service Methods
  async getRestaurantById(restaurantId) {
    try {
      const response = await this.restaurantService.get(
        `/api/restaurants/${restaurantId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get restaurant with ID ${restaurantId}:`,
        error.message
      );
      throw error;
    }
  }

  async getMenuItems(restaurantId) {
    try {
      const response = await this.restaurantService.get(
        `/api/restaurants/${restaurantId}/menu`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to get menu items for restaurant ${restaurantId}:`,
        error.message
      );
      throw error;
    }
  }

  // User Service Methods
  async getUserById(userId) {
    try {
      const response = await this.userService.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get user with ID ${userId}:`, error.message);
      throw error;
    }
  }

  async validateToken(token) {
    try {
      const response = await this.userService.post(
        "/api/users/validate-token",
        { token }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to validate token:", error.message);
      throw error;
    }
  }

  // Cart Service Methods
  async getCart(userId) {
    try {
      const response = await this.cartService.get(`/api/cart/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get cart for user ${userId}:`, error.message);
      throw error;
    }
  }

  async clearCart(userId) {
    try {
      const response = await this.cartService.delete(`/api/cart/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to clear cart for user ${userId}:`, error.message);
      throw error;
    }
  }
}

// Create a singleton instance
const serviceClient = new ServiceClient();

module.exports = serviceClient;
