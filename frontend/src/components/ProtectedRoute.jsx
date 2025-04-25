import { Navigate } from "react-router-dom";
import useAuth from "../services/authService";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // If user is not authenticated, redirect to login page
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, show the protected content
  return children;
};

export default ProtectedRoute;
