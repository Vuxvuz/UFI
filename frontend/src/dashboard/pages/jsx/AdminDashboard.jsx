// src/dashboard/pages/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
// Đường dẫn chính xác tới adminService.js
import adminService from "../../services/adminService";
// Nếu bạn chưa có CSS, bỏ import hoặc tạo file trống
// import './AdminDashboard.css';

export default function AdminDashboard() {
	const [stats, setStats] = useState(null);
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedUser, setSelectedUser] = useState(null);
	const [message, setMessage] = useState("");
	const [notification, setNotification] = useState(null);

	useEffect(() => {
		(async () => {
			try {
				setLoading(true);
				// Load dashboard stats
				const statsRes = await adminService.getDashboard();
				setStats(statsRes.data);

				// Load users for chat initiation
				const usersRes = await adminService.getAllUsers();
				setUsers(usersRes.data);
			} catch (err) {
				console.error(err);
				setNotification({
					type: "danger",
					message: "Failed to load admin data.",
				});
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const handleInitiateChat = async (e) => {
		e.preventDefault();
		if (!selectedUser || !message.trim()) {
			setNotification({
				type: "warning",
				message: "Please select a user and enter a message.",
			});
			return;
		}

		try {
			await adminService.initiateChatWithUser(selectedUser, message);
			setNotification({
				type: "success",
				message: "Chat initiated successfully.",
			});
			setSelectedUser(null);
			setMessage("");
		} catch (err) {
			console.error("Error initiating chat:", err);
			setNotification({
				type: "danger",
				message: "Failed to initiate chat.",
			});
		}
	};

	if (loading) return <div>Loading stats...</div>;
	if (!stats) return <div>No data available.</div>;

	return (
		<div className="admin-dashboard">
			<h2>Admin Dashboard</h2>

			{notification && (
				<div
					className={`alert alert-${notification.type} alert-dismissible fade show`}
					role="alert"
				>
					{notification.message}
					<button
						type="button"
						className="btn-close"
						onClick={() => setNotification(null)}
					></button>
				</div>
			)}

			<div className="row mb-4">
				<div className="col-md-4">
					<div className="card bg-primary text-white mb-4">
						<div className="card-body">
							<h5 className="card-title">Total Users</h5>
							<h2 className="mb-0">{stats.totalUsers}</h2>
						</div>
					</div>
				</div>
				<div className="col-md-4">
					<div className="card bg-success text-white mb-4">
						<div className="card-body">
							<h5 className="card-title">Total Articles</h5>
							<h2 className="mb-0">{stats.totalArticles}</h2>
						</div>
					</div>
				</div>
				<div className="col-md-4">
					<div className="card bg-info text-white mb-4">
						<div className="card-body">
							<h5 className="card-title">Moderators</h5>
							<h2 className="mb-0">{stats.totalModerators || 0}</h2>
						</div>
					</div>
				</div>
			</div>

			<div className="row">
				<div className="col-md-6">
					<div className="card">
						<div className="card-header bg-primary text-white">
							<h5 className="mb-0">Initiate Chat with User</h5>
						</div>
						<div className="card-body">
							<form onSubmit={handleInitiateChat}>
								<div className="mb-3">
									<label htmlFor="userSelect" className="form-label">
										Select User
									</label>
									<select
										id="userSelect"
										className="form-select"
										value={selectedUser || ""}
										onChange={(e) => setSelectedUser(e.target.value)}
									>
										<option value="">Select a user...</option>
										{users.map((user) => (
											<option key={user.id} value={user.id}>
												{user.username} ({user.email})
											</option>
										))}
									</select>
								</div>
								<div className="mb-3">
									<label htmlFor="message" className="form-label">
										Initial Message
									</label>
									<textarea
										id="message"
										className="form-control"
										rows="3"
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										placeholder="Enter your message to the user..."
									></textarea>
								</div>
								<button type="submit" className="btn btn-primary">
									Start Chat
								</button>
							</form>
						</div>
					</div>
				</div>

				<div className="col-md-6">
					<div className="card">
						<div className="card-header bg-primary text-white">
							<h5 className="mb-0">Quick Actions</h5>
						</div>
						<div className="card-body">
							<div className="list-group">
								<a
									href="/admin/users"
									className="list-group-item list-group-item-action"
								>
									<div className="d-flex w-100 justify-content-between">
										<h5 className="mb-1">Manage Users</h5>
										<i className="bi bi-people"></i>
									</div>
									<p className="mb-1">
										View, edit, and manage user accounts and permissions.
									</p>
								</a>
								<a
									href="/admin/articles"
									className="list-group-item list-group-item-action"
								>
									<div className="d-flex w-100 justify-content-between">
										<h5 className="mb-1">Manage Articles</h5>
										<i className="bi bi-file-text"></i>
									</div>
									<p className="mb-1">
										Add, edit, or delete articles and content.
									</p>
								</a>
								<a
									href="/admin/reports"
									className="list-group-item list-group-item-action"
								>
									<div className="d-flex w-100 justify-content-between">
										<h5 className="mb-1">Review Reports</h5>
										<i className="bi bi-flag"></i>
									</div>
									<p className="mb-1">
										Review and handle reported content and users.
									</p>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
