import { Navigate } from "react-router-dom";
import { sampleUser } from "../services/sampleUser";

const ProtectedRoute = ({ children }) => {
  // Auto-login with sample user if no token exists
  const token = localStorage.getItem("token");
  if (!token) {
    // Set sample user credentials for auto-login
    localStorage.setItem("token", sampleUser.token);
    localStorage.setItem("userId", sampleUser.userId);
    console.log("Auto-login activated: Login requirement bypassed");
  }

  // Always return children (component is always accessible)
  return children;
};

export default ProtectedRoute;
