import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setRoles([]);
    setUser(null);
  }, []);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setRoles([]);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { roles: tokenRoles, exp, sub, email } = jwtDecode(token);
      if (Date.now() >= exp * 1000) {
        logout();
      } else {
        setIsAuthenticated(true);
        setRoles(Array.isArray(tokenRoles) ? tokenRoles : []);
        setUser({ id: sub, email });
      }
    } catch {
      logout();
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [checkAuth]);  // ✅ bây giờ đưa checkAuth vào deps

  const login = (token) => {
    localStorage.setItem("token", token);
    checkAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      roles, 
      user, 
      login, 
      logout, 
      loading,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
