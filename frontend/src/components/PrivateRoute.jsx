// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../auth/hooks/useAuth";

export default function PrivateRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, roles, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  if (requiredRoles.length > 0 && !requiredRoles.some(r => roles.includes(r))) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
