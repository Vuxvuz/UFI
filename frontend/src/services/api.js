import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
  // đã bỏ withCredentials để tránh gửi cookie không cần thiết
});

// --- REQUEST INTERCEPTOR
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      if (!config.headers) config.headers = {};
      config.headers["Authorization"] = `Bearer ${token}`;
      console.debug("[API] attaching token:", token.substring(0,10), "…");
    }
    return config;
  },
  error => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR
API.interceptors.response.use(
  response => response,
  error => {
    if ([401, 403].includes(error.response?.status)) {
      console.warn("[API] auth failure, clearing token and redirecting");
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);
