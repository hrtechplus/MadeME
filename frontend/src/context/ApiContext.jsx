import { createContext, useState, useContext } from "react";

export const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const serviceUrls = {
    cart: import.meta.env.VITE_CART_SERVICE_URL || "http://localhost:5002",
    order: import.meta.env.VITE_ORDER_SERVICE_URL || "http://localhost:5001",
    payment:
      import.meta.env.VITE_PAYMENT_SERVICE_URL || "http://localhost:5003",
    restaurant:
      import.meta.env.VITE_RESTAURANT_SERVICE_URL || "http://localhost:5000",
    auth: import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:5004",
  };

  const handleApiCall = async (fetchPromise) => {
    // If fetchPromise is null, clear the error
    if (fetchPromise === null) {
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the token from localStorage
      const token = localStorage.getItem("token");

      // If the fetchPromise is a string (URL), create a new fetch request
      const request =
        typeof fetchPromise === "string"
          ? fetch(fetchPromise, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
          : fetchPromise;

      const response = await request;
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ApiContext.Provider value={{ loading, error, handleApiCall, serviceUrls }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};
