// src/auth/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
import {jwtDecode} from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  const checkToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return false;
    }
    try {
      // Giải mã JWT
      const decoded = jwtDecode(token);
      console.log("Decoded JWT payload:", decoded);

      // Lấy đúng trường 'roles' (payload có "roles": ["ROLE_ADMIN"] ...)
      const { exp, sub, email, roles } = decoded;

      // Chuẩn hóa thành array nếu backend có thể trả string
      const rolesArray = Array.isArray(roles) ? roles : [roles];

      // Nếu token chưa hết hạn
      if (Date.now() < exp * 1000) {
        setUser({
          id: sub,
          email,
          roles: rolesArray
        });
        return true;
      } else {
        // Token đã hết hạn
        localStorage.removeItem("token");
        setUser(null);
        return false;
      }
    } catch (err) {
      // Nếu decode lỗi, xóa token và set user về null
      localStorage.removeItem("token");
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  const login = useCallback(({ token }) => {
    localStorage.setItem("token", token);
    checkToken(); // Ngay sau khi login, load lại user từ token
  }, [checkToken]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/signin");
  }, [navigate]);

  return {
    user,
    // Trả về array 'roles' hoặc mảng rỗng nếu chưa login
    roles: user?.roles || [],
    isAuthenticated: Boolean(user),
    login,
    logout,
    loading,
  };
}
