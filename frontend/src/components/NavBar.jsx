// src/components/NavBar.jsx

import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	FaMoon,
	FaSun,
	FaUserCircle,
	FaSignOutAlt,
	FaNewspaper,
	FaTachometerAlt,
	FaSignInAlt,
	FaUserPlus,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import useDarkMode from "../hooks/useDarkMode";
import useAuth from "../auth/hooks/useAuth";
import "./NavBar.css";

export default function NavBar() {
	const navigate = useNavigate();
	const [darkMode, setDarkMode] = useDarkMode();
	const { isAuthenticated, roles } = useAuth();
	const isMod = roles.includes("ROLE_MODERATOR");
	const isAdmin = roles.includes("ROLE_ADMIN");
	const dropdownRef = useRef(null);

	// Initialize Bootstrap dropdown
	useEffect(() => {
		// Manually initialize Bootstrap dropdowns
		const initializeDropdowns = () => {
			if (typeof window !== "undefined" && window.bootstrap) {
				// Find all dropdown toggles
				const dropdownElementList = document.querySelectorAll(
					'[data-bs-toggle="dropdown"]',
				);

				// Create dropdown instances
				dropdownElementList.forEach((dropdownToggleEl) => {
					try {
						new window.bootstrap.Dropdown(dropdownToggleEl);
					} catch (error) {
						console.error("Error initializing dropdown:", error);
					}
				});
			}
		};

		// Initialize on first render
		initializeDropdowns();

		// Also initialize when DOM changes
		const observer = new MutationObserver(() => {
			initializeDropdowns();
		});

		// Start observing
		observer.observe(document.body, { childList: true, subtree: true });

		// Cleanup
		return () => observer.disconnect();
	}, []);

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/signin");
	};

	const toggleDark = () => {
		setDarkMode(!darkMode);
	};

	return (
		<nav
			className={`navbar fixed-top navbar-expand-lg ${
				darkMode ? "navbar-dark bg-dark" : "navbar-light bg-light"
			}`}
		>
			<div className="container">
				<Link className="navbar-brand me-4 fw-bold" to="/home">
					UFit
				</Link>

				<button
					className="navbar-toggler"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#main-nav"
					aria-controls="main-nav"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon" />
				</button>

				<div className="collapse navbar-collapse" id="main-nav">
					<ul className="navbar-nav me-auto mb-2 mb-lg-0">
						<li className="nav-item">
							<Link className="nav-link" to="/forum">
								Forum
							</Link>
						</li>
						{isAuthenticated && (
							<li className="nav-item">
								<Link className="nav-link" to="/chatbot">
									Chatbot
								</Link>
							</li>
						)}
						{isAuthenticated && (
							<li className="nav-item">
								<Link className="nav-link" to="/plans">
									My Plans
								</Link>
							</li>
						)}
						<li className="nav-item">
							<Link className="nav-link" to="/info-news">
								<FaNewspaper className="me-1" /> News
							</Link>
						</li>
						{isAuthenticated && (isMod || isAdmin) && (
							<li className="nav-item">
								<Link className="nav-link" to="/dashboard">
									<FaTachometerAlt className="me-1" /> Dashboard
								</Link>
							</li>
						)}
					</ul>

					<ul className="navbar-nav ms-auto align-items-center">
						<li className="nav-item me-3">
							<button
								className={`btn ${
									darkMode ? "btn-outline-light" : "btn-outline-dark"
								} rounded-circle p-2 dark-mode-toggle`}
								type="button"
								onClick={toggleDark}
								title={
									darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
								}
								aria-label="Toggle Dark Mode"
							>
								{darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
							</button>
						</li>

						{isAuthenticated ? (
							<li className="nav-item dropdown" ref={dropdownRef}>
								<button
									className="nav-link dropdown-toggle d-flex align-items-center"
									id="accountMenu"
									data-bs-toggle="dropdown"
									aria-expanded="false"
									type="button"
									onClick={(e) => {
										if (window.bootstrap && dropdownRef.current) {
											const dropdown = new window.bootstrap.Dropdown(e.target);
											dropdown.toggle();
										}
									}}
								>
									<FaUserCircle size={20} className="me-1" /> Account
								</button>
								<ul
									className={`dropdown-menu dropdown-menu-end ${
										darkMode ? "dropdown-menu-dark" : ""
									}`}
									aria-labelledby="accountMenu"
								>
									<li>
										<Link className="dropdown-item" to="/profile">
											My Profile
										</Link>
									</li>
									<li>
										<Link className="dropdown-item" to="/account">
											My Account
										</Link>
									</li>
									<li>
										<hr className="dropdown-divider" />
									</li>
									<li>
										<button
											className="dropdown-item d-flex align-items-center"
											type="button"
											onClick={handleLogout}
										>
											<FaSignOutAlt className="me-1" /> Logout
										</button>
									</li>
								</ul>
							</li>
						) : (
							<>
								<li className="nav-item me-2">
									<Link className="btn btn-outline-primary" to="/signin">
										<FaSignInAlt className="me-1" /> Sign In
									</Link>
								</li>
								<li className="nav-item">
									<Link className="btn btn-primary" to="/register">
										<FaUserPlus className="me-1" /> Register
									</Link>
								</li>
							</>
						)}
					</ul>
				</div>
			</div>
		</nav>
	);
}
