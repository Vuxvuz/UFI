import axios from "axios";

// Determine base URL dynamically based on environment
const getBaseUrl = () => {
	// In development, use localhost
	if (process.env.NODE_ENV === "development") {
		return "http://localhost:8080";
	}
	// In production, use relative path
	return "";
};

export const API = axios.create({
	baseURL: getBaseUrl(),
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
	withCredentials: false, // Changed to false to avoid CORS preflight issues
});

// --- REQUEST INTERCEPTOR
API.interceptors.request.use(
	(config) => {
		console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config);

		const token = localStorage.getItem("token");
		if (token) {
			console.log("[API] Using token:", token.substring(0, 10) + "...");
			config.headers["Authorization"] = `Bearer ${token}`;
		} else {
			console.warn("[API] No token found in localStorage");
		}

		// Debug headers
		console.log("[API] Final request headers:", config.headers);
		return config;
	},
	(error) => {
		console.error("[API] Request error:", error);
		return Promise.reject(error);
	},
);

// --- RESPONSE INTERCEPTOR
API.interceptors.response.use(
	(response) => {
		console.log(`[API RESPONSE] ${response.config.url}`, response);
		return response;
	},
	(error) => {
		console.error(`[API ERROR] ${error.config?.url}`, error);
		console.error("Response error details:", error.response?.data);

		const status = error.response?.status;

		// Check if this is a chatbot or OpenAI API error (503 Service Unavailable)
		const isOpenAIError =
			status === 503 &&
			(error.config?.url?.includes("/api/chatbot") ||
				error.config?.url?.includes("/api/plans"));

		// Only consider 401 and 403 as auth errors if they're not OpenAI errors
		const isAuthError = [401, 403].includes(status) && !isOpenAIError;

		// Check if this is a permission error for admin/mod routes
		const isAdminPermissionError =
			status === 403 &&
			(error.config?.url?.includes("/api/admin") ||
				error.config?.url?.includes("/api/mod"));

		// Handle admin permission errors differently - don't redirect
		if (isAdminPermissionError) {
			console.warn("[API] Admin permission error:", error.response?.data);
			return Promise.reject(error);
		}

		const isPermissionError =
			status === 403 &&
			(error.config?.url?.includes("/api/plans") ||
				error.config?.url?.includes("/api/chatbot") ||
				error.config?.url?.includes("/api/chat") ||
				error.config?.url?.includes("/api/forum"));

		const currentPath = window.location.pathname;
		const isPublicPath =
			currentPath.startsWith("/forum") ||
			currentPath === "/" ||
			currentPath.startsWith("/info-news") ||
			currentPath.startsWith("/home");

		// Handle OpenAI API errors differently - don't redirect or logout
		if (isOpenAIError) {
			console.warn(
				"[API] OpenAI API error detected:",
				error.response?.data?.message,
			);
			return Promise.reject(error);
		}

		if (
			isAuthError &&
			!isPermissionError &&
			!isPublicPath &&
			!isAdminPermissionError
		) {
			console.warn(
				"[API] Auth failure on private path, redirecting to /signin",
			);
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
	},
);
