// src/dashboard/pages/UsersPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Form, InputGroup, Badge, Modal } from "react-bootstrap";
import {
	FaSearch,
	FaEdit,
	FaTrash,
	FaUserLock,
	FaUserCheck,
} from "react-icons/fa";
import AdminService from "../../services/adminService";
import "../DashboardPages.css";

const UsersPage = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [selectedRole, setSelectedRole] = useState("");

	// User edit modal state
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingUser, setEditingUser] = useState(null);
	const [editFormData, setEditFormData] = useState({
		username: "",
		email: "",
		role: "",
		active: true,
	});

	const fetchUsers = useCallback(async () => {
		try {
			setLoading(true);
			console.log("Fetching users...");
			const response = await AdminService.getAllUsers();
			console.log("Users response:", response);
			setUsers(response.data.content || response.data);
			setTotalPages(response.data.totalPages || 1);
			setError(null);
		} catch (err) {
			console.error("Error fetching users:", err);
			setError(
				`Failed to fetch users: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleSearch = (e) => {
		e.preventDefault();
		setCurrentPage(1);
		fetchUsers();
	};

	const handleRoleChange = (e) => {
		setSelectedRole(e.target.value);
		setCurrentPage(1);
	};

	const handlePageChange = (newPage) => {
		setCurrentPage(newPage);
	};

	const handleDeleteUser = async (userId) => {
		if (window.confirm("Are you sure you want to delete this user?")) {
			try {
				await AdminService.deleteUser(userId);
				fetchUsers();
			} catch (err) {
				console.error("Error deleting user:", err);
				alert(
					`Failed to delete user: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
				);
			}
		}
	};

	const handleToggleStatus = async (userId, currentStatus) => {
		try {
			await AdminService.updateUserStatus(userId, {
				active: !currentStatus,
			});
			fetchUsers();
		} catch (err) {
			console.error("Error updating user status:", err);
			alert(
				`Failed to update user status: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
			);
		}
	};

	const handleOpenEditModal = (user) => {
		setEditingUser(user);
		setEditFormData({
			username: user.username,
			email: user.email,
			role: user.role,
			active: user.active,
		});
		setShowEditModal(true);
	};

	const handleCloseEditModal = () => {
		setShowEditModal(false);
		setEditingUser(null);
	};

	const handleEditFormChange = (e) => {
		const { name, value, type, checked } = e.target;
		setEditFormData({
			...editFormData,
			[name]: type === "checkbox" ? checked : value,
		});
	};

	const handleEditSubmit = async (e) => {
		e.preventDefault();
		try {
			// Cập nhật role
			await AdminService.updateUser(editingUser.id, editFormData);

			// Cập nhật trạng thái active nếu thay đổi
			if (editingUser.active !== editFormData.active) {
				await AdminService.updateUserStatus(editingUser.id, {
					active: editFormData.active,
				});
			}

			fetchUsers();
			handleCloseEditModal();
		} catch (err) {
			console.error("Error updating user:", err);
			alert(
				`Failed to update user: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
			);
		}
	};

	const getRoleBadgeVariant = (role) => {
		switch (role) {
			case "ROLE_ADMIN":
				return "danger";
			case "ROLE_MODERATOR":
				return "warning";
			case "ROLE_USER":
				return "info";
			default:
				return "secondary";
		}
	};

	if (loading) {
		return (
			<div className="text-center p-5 dashboard-page">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div
				className="alert alert-danger m-5 dashboard-alert dashboard-alert-danger"
				role="alert"
			>
				{error}
			</div>
		);
	}

	return (
		<div className="dashboard-page">
			<h1 className="dashboard-page-title">User Management</h1>

			<div className="d-flex justify-content-between align-items-center mb-4">
				<div>
					<Form onSubmit={handleSearch} className="d-flex dashboard-search">
						<InputGroup>
							<Form.Control
								type="text"
								placeholder="Search users..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="dashboard-form-control"
							/>
							<Button variant="primary" type="submit">
								<FaSearch />
							</Button>
						</InputGroup>
					</Form>
				</div>
				<div>
					<Form.Select
						value={selectedRole}
						onChange={handleRoleChange}
						className="dashboard-form-control dashboard-filter"
					>
						<option value="">All Roles</option>
						<option value="ROLE_ADMIN">Admin</option>
						<option value="ROLE_MODERATOR">Moderator</option>
						<option value="ROLE_USER">User</option>
					</Form.Select>
				</div>
			</div>

			<Table striped bordered hover responsive className="dashboard-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Username</th>
						<th>Email</th>
						<th>Role</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr key={user.id}>
							<td>{user.id}</td>
							<td>{user.username}</td>
							<td>{user.email}</td>
							<td>
								<Badge
									bg={getRoleBadgeVariant(user.role)}
									className="user-role-badge dashboard-badge"
								>
									{user.role.replace("ROLE_", "")}
								</Badge>
							</td>
							<td>
								<span
									className={
										user.active ? "user-status-active" : "user-status-inactive"
									}
								>
									{user.active ? "Active" : "Inactive"}
								</span>
							</td>
							<td>
								<Button
									variant="outline-primary"
									size="sm"
									className="me-2 dashboard-action-btn"
									title="Edit User"
									onClick={() => handleOpenEditModal(user)}
								>
									<FaEdit />
								</Button>
								<Button
									variant={user.active ? "outline-warning" : "outline-success"}
									size="sm"
									className="me-2 dashboard-action-btn"
									onClick={() => handleToggleStatus(user.id, user.active)}
									title={user.active ? "Deactivate User" : "Activate User"}
								>
									{user.active ? <FaUserLock /> : <FaUserCheck />}
								</Button>
								<Button
									variant="outline-danger"
									size="sm"
									className="dashboard-action-btn"
									onClick={() => handleDeleteUser(user.id)}
									title="Delete User"
								>
									<FaTrash />
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</Table>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="d-flex justify-content-center dashboard-pagination">
					<ul className="pagination">
						<li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
							<Button
								className="page-link"
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
							>
								Previous
							</Button>
						</li>
						{[...Array(totalPages).keys()].map((page) => (
							<li
								key={page + 1}
								className={`page-item ${
									currentPage === page + 1 ? "active" : ""
								}`}
							>
								<Button
									className="page-link"
									onClick={() => handlePageChange(page + 1)}
								>
									{page + 1}
								</Button>
							</li>
						))}
						<li
							className={`page-item ${
								currentPage === totalPages ? "disabled" : ""
							}`}
						>
							<Button
								className="page-link"
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages}
							>
								Next
							</Button>
						</li>
					</ul>
				</div>
			)}

			{/* Edit User Modal */}
			<Modal show={showEditModal} onHide={handleCloseEditModal}>
				<Modal.Header closeButton>
					<Modal.Title>Edit User</Modal.Title>
				</Modal.Header>
				<Form onSubmit={handleEditSubmit}>
					<Modal.Body>
						<Form.Group className="mb-3">
							<Form.Label>Username</Form.Label>
							<Form.Control
								type="text"
								name="username"
								value={editFormData.username}
								readOnly
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Email</Form.Label>
							<Form.Control
								type="email"
								name="email"
								value={editFormData.email}
								readOnly
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Role</Form.Label>
							<Form.Select
								name="role"
								value={editFormData.role}
								onChange={handleEditFormChange}
								required
							>
								<option value="ROLE_USER">User</option>
								<option value="ROLE_MODERATOR">Moderator</option>
								<option value="ROLE_ADMIN">Admin</option>
							</Form.Select>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Check
								type="checkbox"
								name="active"
								label="Active"
								checked={editFormData.active}
								onChange={handleEditFormChange}
							/>
						</Form.Group>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={handleCloseEditModal}>
							Cancel
						</Button>
						<Button variant="primary" type="submit">
							Save Changes
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>
		</div>
	);
};

export default UsersPage;
