import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component (Higher-Order Component)
 * Guards routes that require the user to be logged in.
 * * Usage:
 * <ProtectedRoute>
 * <PlannerPage />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children }) => {
  // Check for the existence of a token
  const token = localStorage.getItem('userToken');
  
  // 1. Not Authenticated -> Redirect to Login
  if (!token) {
    // 'replace' prop prevents the user from clicking "Back" to return here
    return <Navigate to="/login" replace />;
  }

  // 2. Authenticated -> Render the protected page
  return children;
};

export default ProtectedRoute;