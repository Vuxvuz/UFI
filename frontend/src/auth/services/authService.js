import axios from "axios";

// Tạo axios instance cho auth
const API = axios.create({
	baseURL: "http://localhost:8080/api/auth",
	headers: { "Content-Type": "application/json" },
});

// Tự động gắn Authorization header nếu có token
API.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers["Authorization"] = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

const authService = {
	// Login
	login: async ({ email, password }) => {
		const response = await API.post("/login", { email, password });
		if (response.data?.token) {
			localStorage.setItem("token", response.data.token);
		}
		return response;
	},

	// Register
	register: async (data) => {
		const response = await API.post("/register", data);
		return response;
	},

	// Forgot password
	forgotPassword: async ({ email }) => {
		return await API.post("/forgot-password", { email });
	},

	// Reset password
	resetPassword: async ({ token, newPassword }) => {
		return await API.post("/reset-password", { token, newPassword });
	},

	// Google login
	googleLogin: async (payload) => {
		const response = await API.post("/google", payload);
		if (response.data?.token) {
			localStorage.setItem("token", response.data.token);
		}
		return response;
	},

	// Get user profile
	getProfile: async () => {
		const res = await API.get("/../user/profile");
		return res;
	},

	// Update user profile
	updateProfile: async (data) => {
		const res = await API.put("/../user/profile", data);
		return res;
	},

	// Logout
	logout: () => {
		localStorage.removeItem("token");
	},

	// Check authentication
	isAuthenticated: () => !!localStorage.getItem("token"),
	getToken: () => localStorage.getItem("token"),
};

export default authService;
