import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/hooks/useAuth";

export default function PrivateRoute({ children, requiredRoles = ["USER"] }) {
  const { isAuthenticated, roles, loading } = useAuth();

  // Hiển thị loading indicator nếu đang kiểm tra xác thực
  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  // Chuyển hướng đến trang đăng nhập nếu chưa xác thực
  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  // Kiểm tra quyền nếu cần
  if (requiredRoles.length > 0 && !requiredRoles.some(role => roles.includes(role))) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}