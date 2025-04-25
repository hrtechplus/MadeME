import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  
  // Check if user is logged in and has admin role
  if (!token || userRole !== "admin") {
    return <Navigate to="/login" />;
  }
  
  // If user is admin, show the protected admin content
  return children;
};

export default AdminRoute;