import React from "react";
import { Navigate } from "react-router-dom";

/**
 * AdminRoute Component (Higher-Order Component)
 * Acts as a security guard for frontend routes.
 * * Logic:
 * 1. Check if user is logged in (Token exists).
 * 2. Check if user has 'admin' privileges.
 * * Note: Real security happens on the backend. This just prevents 
 * standard users from accidentally stumbling into the admin UI.
 */
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("userToken");
  const role = localStorage.getItem("userRole");

  // 1. Unauthenticated -> Redirect to Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Unauthorized (Normal User) -> Redirect to Planner (Victim View)
  if (role !== "admin") {
    return <Navigate to="/planner" replace />;
  }

  // 3. Authorized -> Render the protected Admin Dashboard
  return children;
};

export default AdminRoute;