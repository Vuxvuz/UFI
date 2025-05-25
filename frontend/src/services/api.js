import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  // đã bỏ withCredentials để tránh gửi cookie không cần thiết
});

// --- REQUEST INTERCEPTOR
API.interceptors.request.use(
  config => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config);

    const token = localStorage.getItem("token");
    if (token) {
      console.log("[API] Using token:", token.substring(0, 10) + "...");
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("[API] No token found in localStorage");
    }
    return config;
  },
  error => {
    console.error("[API] Request error:", error);
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR
API.interceptors.response.use(
  response => response,
  error => {
    const isAuthError = [401, 403].includes(error.response?.status);

    const isPermissionError =
      error.response?.status === 403 &&
      (error.config?.url?.includes("/api/plans") ||
        error.config?.url?.includes("/api/chatbot") ||
        error.config?.url?.includes("/api/chat"));

    const currentPath = window.location.pathname;
    const isPublicPath = currentPath.startsWith("/forum") || currentPath === "/" || currentPath.startsWith("/info-news") || currentPath.startsWith("/home");

    if (isAuthError && !isPermissionError && !isPublicPath) {
      console.warn("[API] auth failure on private path, redirecting to /signin");
      return new Promise((_, reject) => {
        setTimeout(() => {
          localStorage.removeItem("token");
          window.location.href = "/signin";
          reject(error);
        }, 100);
      });
    }

    if (isPermissionError) {
      console.warn(`[API] Permission denied for ${error.config?.url}`);
    }

    return Promise.reject(error);
  }
);
