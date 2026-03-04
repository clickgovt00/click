// Protected Route - Redirect if not authenticated

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, token } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!token) {   // isAuthenticated → !token
  return <Navigate to="/" replace />;
}

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard
    if (user?.role === 'operator') return <Navigate to="/operator/dashboard" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'owner') return <Navigate to="/owner/dashboard" replace />;
    if (user?.role === 'central_supervisor') return <Navigate to="/central-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;