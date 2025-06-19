// src/components/Dashboard/Header.jsx

import React from "react";
// Đường dẫn chính xác tới useAuth.js
import useAuth from "../../auth/hooks/useAuth";
// Đường dẫn chính xác tới authService.js
import authService from "../../auth/services/authService";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
	const { user, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		authService.logout();
		navigate("/signin");
	};

	return (
		<header className="dashboard-header">
			<div className="header-left">
				{isAuthenticated && <h3>Welcome, {user?.email}</h3>}
			</div>
			<div className="header-right">
				{isAuthenticated && (
					<button onClick={handleLogout} className="logout-button">
						Logout
					</button>
				)}
			</div>
		</header>
	);
}
