import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoading } from '../common';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) return <PageLoading text="Checking authentication..." />;

  // Redirect to login if not authenticated, preserve next route
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based permissions: if user lacks permission, show redirect to dashboard or a simple message
  if (allowedRoles?.length > 0 && !hasPermission(allowedRoles)) {
    // Optionally, you could show an unauthorized page here
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;