import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
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
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const { exp, sub, email, roles } = decoded;
      if (Date.now() >= exp * 1000) {
        // token hết hạn
        localStorage.removeItem("token");
        setUser(null);
      } else {
        // token còn hạn ⇒ khởi tạo lại user
        setUser({
          id: sub,
          email,
          roles: Array.isArray(roles) ? roles : [roles],
        });
      }
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  const login = useCallback((response) => {
    const { token } = response;
    localStorage.setItem("token", token);
    checkToken();            // sau khi login, gọi lại để nạp user
  }, [checkToken]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/signin");
  }, [navigate]);

  return {
    user,
    roles: user?.roles || [],
    isAuthenticated: Boolean(user),
    login,
    logout,
    loading,
  };
}
