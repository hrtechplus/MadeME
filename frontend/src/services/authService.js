import axios from "axios";

const API_URL = "http://localhost:5000/api"; // Replace with your auth service URL

const authService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.userId);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
  },

  getCurrentUser: () => {
    return {
      token: localStorage.getItem("token"),
      userId: localStorage.getItem("userId"),
    };
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

export default authService;
