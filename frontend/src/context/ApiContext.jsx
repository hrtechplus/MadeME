import React, { createContext, useContext, useState } from "react";

const ApiContext = createContext();

export function ApiProvider({ children }) {
  // Default service URLs - can be overridden by environment variables
  const [serviceUrls] = useState({
    auth: import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:5000",
    cart: import.meta.env.VITE_CART_SERVICE_URL || "http://localhost:5002",
    order: import.meta.env.VITE_ORDER_SERVICE_URL || "http://localhost:5001",
    payment:
      import.meta.env.VITE_PAYMENT_SERVICE_URL || "http://localhost:5003",
    restaurant:
      import.meta.env.VITE_RESTAURANT_SERVICE_URL || "http://localhost:5004",
    user: import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:5004",
  });

  // Generic API call handler with error handling
  const handleApiCall = async (fetchPromise) => {
    try {
      const response = await fetchPromise;

      if (!response.ok) {
        // Try to parse error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        } catch (e) {
          throw new Error(`Error: ${response.status}`);
        }
      }

      // Parse successful response
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      console.error("API call error:", error.message);
      throw error;
    }
  };

  return (
    <ApiContext.Provider value={{ serviceUrls, handleApiCall }}>
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
