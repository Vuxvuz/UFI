// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../auth/hooks/useAuth";

export default function PrivateRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, roles, loading } = useAuth();

  // Debug: in ra state của hook mỗi lần render
  console.log("[PrivateRoute] loading:", loading);
  console.log("[PrivateRoute] isAuthenticated:", isAuthenticated);
  console.log("[PrivateRoute] roles:", roles);

  // Nếu vẫn đang chờ check token
  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  // Nếu chưa login (hoặc token invalid, setUser = null)
  if (!isAuthenticated) {
    console.log("[PrivateRoute] Redirect to /signin vì !isAuthenticated");
    return <Navigate to="/signin" replace />;
  }

  // Nếu đã login nhưng không có role phù hợp
  if (
    requiredRoles.length > 0 &&
    !requiredRoles.some((r) => roles.includes(r))
  ) {
    console.log(
      "[PrivateRoute] Redirect to /unauthorized vì roles không khớp:",
      roles,
      "required:", requiredRoles
    );
    return <Navigate to="/unauthorized" replace />;
  }

  // Nếu đã login và role đúng → render children (DashboardRoutes)
  return children;
}
