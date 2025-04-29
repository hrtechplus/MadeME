import { useApi } from "../context/ApiContext";
import { sampleUser, adminUser, loginWithSampleUser } from "./sampleUser";

const useAuth = () => {
  const { handleApiCall, serviceUrls } = useApi();
  // Set this to false to use the real user microservice instead of sample data
  const useLocalSampleUsers = false;

  const login = async (email, password) => {
    try {
      // Use sample users for quick testing if enabled
      if (useLocalSampleUsers) {
        console.log("Development mode: Using local sample users");

        if (
          (email === sampleUser.email && password === sampleUser.password) ||
          (email === adminUser.email && password === adminUser.password)
        ) {
          console.log("Using sample login data");
          const result = await loginWithSampleUser(email, password);
          return result;
        } else {
          throw new Error(
            "Invalid credentials. Use regular user (email: test@example.com, password: password123) or admin user (email: admin@mademe.com, password: admin123)"
          );
        }
      }

      // Use the real user-service microservice
      console.log("Using real user-service for authentication");

      // Add retry mechanism with exponential backoff
      let retryCount = 0;
      const maxRetries = 2;
      const baseDelay = 1000; // 1 second initial delay

      while (retryCount <= maxRetries) {
        try {
          const response = await fetch(`${serviceUrls.user}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter =
              response.headers.get("Retry-After") ||
              Math.pow(2, retryCount) * baseDelay;
            console.log(`Rate limited. Retrying after ${retryAfter}ms...`);
            await new Promise((resolve) => setTimeout(resolve, retryAfter));
            retryCount++;
            continue;
          }

          if (!response.ok) {
            // Try to parse error as JSON first
            const errorText = await response.text();
            let errorMessage = "Authentication failed";

            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
              // If parsing fails, use the text directly
              errorMessage =
                errorText || `Error: ${response.status} ${response.statusText}`;
            }

            throw new Error(errorMessage);
          }

          // Parse the JSON response
          const text = await response.text();
          const data = text ? JSON.parse(text) : {};

          if (data.token) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.user._id);
            localStorage.setItem("userRole", data.user.role || "customer");
            localStorage.setItem("userName", data.user.name || "");
          }

          return {
            token: data.token,
            userId: data.user._id,
            role: data.user.role,
          };
        } catch (error) {
          if (
            error.message.includes("Unexpected token") &&
            retryCount < maxRetries
          ) {
            // This is likely a parsing error, retry after delay
            const delay = Math.pow(2, retryCount) * baseDelay;
            console.log(`Parsing error, retrying after ${delay}ms...`, error);
            await new Promise((resolve) => setTimeout(resolve, delay));
            retryCount++;
          } else {
            // Re-throw the error if it's not a parsing error or if max retries reached
            throw error;
          }
        }
      }

      throw new Error(
        "Login failed after multiple attempts. Please try again later."
      );
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      if (useLocalSampleUsers) {
        // Mock registration success
        console.log("Mock registration:", userData);
        return { success: true };
      }

      // For debugging
      console.log("Registering with:", userData);
      console.log("URL:", `${serviceUrls.user}/api/auth/register`);

      const response = await fetch(`${serviceUrls.user}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          // We don't send confirmPassword to the backend
        }),
      });

      // For debugging
      console.log("Registration response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Registration error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Registration failed: ${response.status}`);
        }
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();
      console.log("Registration successful:", data);
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
  };

  const getCurrentUser = () => {
    return {
      token: localStorage.getItem("token"),
      userId: localStorage.getItem("userId"),
      role: localStorage.getItem("userRole") || "customer",
      name: localStorage.getItem("userName") || "",
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
    register,
    getCurrentUser,
    isAuthenticated,
    isAdmin,
  };
};

export default useAuth;
