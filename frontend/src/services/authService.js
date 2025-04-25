import { useApi } from "../context/ApiContext";
import { sampleUser, adminUser, loginWithSampleUser } from "./sampleUser";

const useAuth = () => {
  const { handleApiCall, serviceUrls } = useApi();
  const isDevelopment = true; // Set to true for development mode

  const login = async (email, password) => {
    try {
      // Always use sample user in development mode if credentials match
      if (isDevelopment) {
        console.log("Development mode: Checking credentials");

        if ((email === sampleUser.email && password === sampleUser.password) || 
            (email === adminUser.email && password === adminUser.password)) {
          console.log("Using login in development mode");
          const result = await loginWithSampleUser(email, password);
          return result;
        } else {
          throw new Error(
            "Invalid credentials. Use regular user (email: test@example.com, password: password123) or admin user (email: admin@mademe.com, password: admin123)"
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
        localStorage.setItem("userRole", data.role || "user");
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
    localStorage.removeItem("userRole");
  };

  const getCurrentUser = () => {
    return {
      token: localStorage.getItem("token"),
      userId: localStorage.getItem("userId"),
      role: localStorage.getItem("userRole") || "user"
    };
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  const isAdmin = () => {
    return localStorage.getItem("userRole") === "admin";
  };

  return {
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
    isAdmin,
  };
};

export default useAuth;
