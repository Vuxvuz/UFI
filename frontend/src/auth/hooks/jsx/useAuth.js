// src/auth/hooks/useAuth.js
import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function useAuth() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	const checkToken = useCallback(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			console.log("useAuth: No token found in localStorage");
			setUser(null);
			setLoading(false);
			return false;
		}
		try {
			// Giải mã JWT
			const decoded = jwtDecode(token);
			console.log("useAuth: Decoded JWT payload:", decoded);

			// Lấy đúng trường 'roles' (payload có "roles": ["ROLE_ADMIN"] ...)
			const { exp, sub, email, roles } = decoded;

			// Ensure roles is always an array
			let rolesArray;
			if (!roles) {
				console.warn("useAuth: No roles found in token");
				rolesArray = [];
			} else if (Array.isArray(roles)) {
				rolesArray = roles;
			} else if (typeof roles === "string") {
				rolesArray = [roles];
			} else {
				console.warn("useAuth: Unexpected roles format:", roles);
				rolesArray = [];
			}

			console.log("useAuth: Parsed roles:", rolesArray);

			// Nếu token chưa hết hạn
			if (Date.now() < exp * 1000) {
				setUser({
					id: sub,
					email,
					roles: rolesArray,
				});
				return true;
			} else {
				// Token đã hết hạn
				console.log("useAuth: Token expired");
				localStorage.removeItem("token");
				setUser(null);
				return false;
			}
		} catch (err) {
			// Nếu decode lỗi, xóa token và set user về null
			console.error("useAuth: Error decoding token:", err);
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

	const login = useCallback(
		({ token }) => {
			console.log(
				"useAuth: Logging in with token:",
				`${token.substring(0, 15)}...`,
			);
			localStorage.setItem("token", token);
			checkToken(); // Ngay sau khi login, load lại user từ token
		},
		[checkToken],
	);

	const logout = useCallback(() => {
		console.log("useAuth: Logging out");
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
