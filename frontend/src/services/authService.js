import { useApi } from "../context/ApiContext";
import { sampleUser, loginWithSampleUser } from "./sampleUser";

const useAuth = () => {
  const { handleApiCall, serviceUrls } = useApi();
  const isDevelopment = true; // Set to true for development mode

  const login = async (email, password) => {
    try {
      // Always use sample user in development mode if credentials match
      if (isDevelopment) {
        console.log("Development mode: Checking sample user credentials");

        if (email === sampleUser.email && password === sampleUser.password) {
          console.log("Using sample user login in development mode");
          const result = await loginWithSampleUser();
          return result;
        } else {
          throw new Error(
            "Invalid credentials. Use email: test@example.com, password: password123"
          );
        }
      }

      // This code will only run in production mode
      const response = await fetch(`${serviceUrls.auth}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
  };

  const getCurrentUser = () => {
    return {
      token: localStorage.getItem("token"),
      userId: localStorage.getItem("userId"),
    };
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  return {
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
  };
};

export default useAuth;
