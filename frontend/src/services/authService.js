import { useApi } from "../context/ApiContext";

const useAuth = () => {
  const { handleApiCall, serviceUrls } = useApi();

  const login = async (email, password) => {
    try {
      const { data } = await handleApiCall(
        `${serviceUrls.auth}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw new Error(error.message || "Login failed. Please try again.");
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
