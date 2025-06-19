// src/routes/DashboardRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../components/Dashboard/jsx/DashboardLayout";

import ModeratorDashboard from "../dashboard/pages/jsx/ModeratorDashboard";
import AdminDashboard from "../dashboard/pages/jsx/AdminDashboard";
import ReportsPage from "../dashboard/pages/jsx/ReportsPage";
import CategoriesPage from "../dashboard/pages/jsx/CategoriesPage";
import TopicsPage from "../dashboard/pages/jsx/TopicsPage";
import ChatSupportPage from "../dashboard/pages/jsx/ChatSupportPage";
import UsersPage from "../dashboard/pages/jsx/UsersPage";
import ArticlesPage from "../dashboard/pages/jsx/ArticlesPage";
import SystemInfoPage from "../dashboard/pages/jsx/SystemInfoPage";

import useAuth from "../auth/hooks/useAuth";

export default function DashboardRoutes() {
	const { roles, loading } = useAuth();

	// 1) Nếu useAuth vẫn đang loading token/ user data, chờ một chút
	if (loading) {
		return <div className="text-center p-5">Loading dashboard...</div>;
	}

	// 2) Sau khi loading = false, thì roles đã sẵn sàng (vd. ['ROLE_ADMIN'] hoặc ['ROLE_MODERATOR']).
	console.log("[DashboardRoutes] roles:", roles);

	const isMod = roles.includes("ROLE_MODERATOR");
	const isAdmin = roles.includes("ROLE_ADMIN");

	return (
		<Routes>
			<Route path="/" element={<DashboardLayout />}>
				<Route
					index
					element={
						isAdmin ? (
							<AdminDashboard />
						) : isMod ? (
							<ModeratorDashboard />
						) : (
							<Navigate to="/unauthorized" replace />
						)
					}
				/>

				<Route
					path="reports"
					element={
						isAdmin || isMod ? (
							<ReportsPage />
						) : (
							<Navigate to="/unauthorized" replace />
						)
					}
				/>

				{/* Chỉ Moderator */}
				<Route
					path="categories"
					element={
						isMod ? <CategoriesPage /> : <Navigate to="/unauthorized" replace />
					}
				/>
				<Route
					path="topics"
					element={
						isMod ? <TopicsPage /> : <Navigate to="/unauthorized" replace />
					}
				/>
				<Route
					path="chat"
					element={
						isMod ? (
							<ChatSupportPage />
						) : (
							<Navigate to="/unauthorized" replace />
						)
					}
				/>

				{/* Chỉ Admin */}
				<Route
					path="users"
					element={
						isAdmin ? <UsersPage /> : <Navigate to="/unauthorized" replace />
					}
				/>
				<Route
					path="articles"
					element={
						isAdmin ? <ArticlesPage /> : <Navigate to="/unauthorized" replace />
					}
				/>
				<Route
					path="system"
					element={
						isAdmin ? (
							<SystemInfoPage />
						) : (
							<Navigate to="/unauthorized" replace />
						)
					}
				/>
			</Route>
		</Routes>
	);
}
