// src/auth/authService.js
import axios from "axios";

// Create axios instance
const API = axios.create({
  baseURL: "http://localhost:8080/api/auth",
  headers: { "Content-Type": "application/json" }
});

// Add request interceptor to include authorization token in requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Define authentication services
const authService = {
  // Login with email and password
  login: async ({ email, password }) => {
    try {
      const response = await API.post("/login", { email, password });
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Register new user
  register: async (data) => {
    try {
      const response = await API.post("/register", data);
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Request password reset
  forgotPassword: async ({ email }) => {
    try {
      return await API.post("/forgot-password", { email });
    } catch (error) {
      console.error("Forgot password error:", error);
      throw error;
    }
  },

  // Reset password with token
  resetPassword: async ({ token, newPassword }) => {
    try {
      return await API.post("/reset-password", { token, newPassword });
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  // Login with Google
  googleLogin: async ({ email, googleId, token }) => {
    try {
      const response = await API.post("/google", { email, googleId, token });
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return response;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem("token");
  },

  // Get user profile
  getProfile: async () => {
    try {
      // This assumes your profile endpoint is at the parent API level
      const baseURL = API.defaults.baseURL;
      const parentURL = baseURL.substring(0, baseURL.lastIndexOf('/'));
      return await axios.get(`${parentURL}/profile`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
    } catch (error) {
      console.error("Get profile error:", error);
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  // Get current token
  getToken: () => {
    return localStorage.getItem("token");
  }
};

export default authService;