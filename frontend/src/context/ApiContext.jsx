import { createContext, useContext, useState, useCallback } from "react";
import api from "../api";

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiCall = useCallback(async (apiCall, ...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(...args);
      return response.data;
    } catch (error) {
      setError(error.message || "An error occurred");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    api,
    loading,
    error,
    handleApiCall,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};
