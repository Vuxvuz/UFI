// src/components/Dashboard/DashboardLayout.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./DashboardLayout.css";

export default function DashboardLayout() {
	return (
		<div className="dashboard-container">
			<Sidebar />
			<div className="dashboard-main">
				<Header />
				<div className="dashboard-content">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
