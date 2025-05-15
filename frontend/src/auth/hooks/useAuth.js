// src/auth/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
import { jwtDecode }from "jwt-decode";
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
      const decoded = jwtDecode(token);
      const { exp, sub, email, role } = decoded;  
      // nếu chưa hết hạn thì “hồi” lại user
      if (Date.now() < exp * 1000) {
        setUser({ id: sub, email, role: Array.isArray(role) ? role : [role] });
        return true;
      } else {
        // token hết hạn
        localStorage.removeItem("token");
        setUser(null);
        return false;
      }
    } catch (err) {
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

  const login = useCallback(({ token, ...rest }) => {
    localStorage.setItem("token", token);
    checkToken();              // ngay sau khi login thì load user
  }, [checkToken]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/signin");
  }, [navigate]);

  return {
    user,
    roles: user?.role || [],     // nếu bạn decode thành mảng role
    isAuthenticated: Boolean(user),
    login,
    logout,
    loading,
  };
}
