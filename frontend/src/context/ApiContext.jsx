import React, { createContext, useContext, useState } from "react";

// Create and export the ApiContext
const ApiContext = createContext();
export { ApiContext };

export function ApiProvider({ children }) {
  // Default service URLs - can be overridden by environment variables
  const [serviceUrls] = useState({
    auth: import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:5004",
    cart: import.meta.env.VITE_CART_SERVICE_URL || "http://localhost:5002",
    order: import.meta.env.VITE_ORDER_SERVICE_URL || "http://localhost:5001",
    payment:
      import.meta.env.VITE_PAYMENT_SERVICE_URL || "http://localhost:5003",
    restaurant:
      import.meta.env.VITE_RESTAURANT_SERVICE_URL || "http://localhost:5004",
    user: import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:5004", // Updated to match actual port
  });

  // Helper function to standardize API route paths
  const standardizePath = (base, path) => {
    // Ensure path starts with /api/
    if (!path.startsWith("/api/")) {
      path = path.startsWith("/") ? `/api${path}` : `/api/${path}`;
    }

    // Fix order routes to ensure consistent pluralization
    if (base === serviceUrls.order) {
      // Ensure we use 'orders' (plural) in route paths for consistency
      path = path.replace("/api/order/", "/api/orders/");
    }

    return `${base}${path}`;
  };

  // Generic API call handler with improved error handling
  const handleApiCall = async (fetchPromise) => {
    try {
      const response = await fetchPromise;

      if (!response.ok) {
        // Try to parse error message from response
        try {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              errorData.error ||
              `Request failed with status: ${response.status}`
          );
        } catch (e) {
          // If we can't parse the JSON, use a generic error message
          if (e.message.includes("JSON")) {
            throw new Error(`Request failed with status: ${response.status}`);
          }
          throw e; // Rethrow parsed error
        }
      }

      // Handle no-content responses
      if (response.status === 204) {
        return { data: null, status: 204 };
      }

      // Parse successful response
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      console.error("API call error:", error.message);
      throw error;
    }
  };

  // Extended API handler with path standardization
  const makeApiCall = async (serviceKey, path, options = {}) => {
    if (!serviceUrls[serviceKey]) {
      throw new Error(`Unknown service: ${serviceKey}`);
    }

    const url = standardizePath(serviceUrls[serviceKey], path);
    return handleApiCall(fetch(url, options));
  };

  return (
    <ApiContext.Provider
      value={{
        serviceUrls,
        handleApiCall,
        makeApiCall,
        standardizePath,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
}
