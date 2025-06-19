import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import "./DashboardPage.css";

const DashboardPage = () => {
	const [stats, setStats] = useState({
		totalUsers: 0,
		totalArticles: 0,
		moderators: 0,
	});
	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			// Fetch dashboard stats
			const statsResponse = await axios.get("/api/admin/stats");
			setStats(statsResponse.data);

			// Fetch users for dropdown
			const usersResponse = await axios.get("/api/admin/users");
			setUsers(usersResponse.data);
			setLoading(false);
		} catch (err) {
			setError("Failed to load dashboard data. Please try again later.");
			setLoading(false);
		}
	};

	const handleUserSelect = (e) => {
		setSelectedUser(e.target.value);
	};

	const handleMessageChange = (e) => {
		setMessage(e.target.value);
	};

	const handleStartChat = async (e) => {
		e.preventDefault();
		if (!selectedUser || !message.trim()) {
			alert("Please select a user and enter a message.");
			return;
		}

		try {
			await axios.post("/api/admin/messages", {
				userId: selectedUser,
				content: message,
			});
			alert("Message sent successfully!");
			setMessage("");
		} catch (err) {
			alert("Failed to send message. Please try again.");
		}
	};

	if (loading) {
		return (
			<div className="text-center p-5 dashboard-container">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="alert alert-danger m-5" role="alert">
				{error}
			</div>
		);
	}

	return (
		<div className="dashboard-container">
			<div className="dashboard-sidebar">
				<h2 className="p-3 dashboard-title">Dashboard</h2>
				<ul className="nav flex-column dashboard-nav">
					<li className="nav-item">
						<Link to="/dashboard" className="nav-link active">
							Home
						</Link>
					</li>
					<li className="nav-item">
						<Link to="/dashboard/reports" className="nav-link">
							Reports
						</Link>
					</li>
					<li className="nav-item">
						<Link to="/dashboard/users" className="nav-link">
							Users
						</Link>
					</li>
					<li className="nav-item">
						<Link to="/dashboard/articles" className="nav-link">
							Articles
						</Link>
					</li>
					<li className="nav-item">
						<Link to="/dashboard/system" className="nav-link">
							System Info
						</Link>
					</li>
				</ul>
			</div>

			<div className="dashboard-main">
				<Container fluid className="p-4">
					<div className="d-flex justify-content-between align-items-center mb-4">
						<h1 className="dashboard-welcome">Welcome, Admin</h1>
						<Button variant="danger" className="dashboard-logout">
							Logout
						</Button>
					</div>

					<Row className="mb-4">
						<Col md={4} className="mb-3">
							<Card className="dashboard-card dashboard-stats">
								<Card.Body className="text-center">
									<h2 className="display-4 dashboard-stat-number">
										{stats.totalUsers}
									</h2>
									<Card.Title className="dashboard-stat-title">
										Total Users
									</Card.Title>
								</Card.Body>
							</Card>
						</Col>
						<Col md={4} className="mb-3">
							<Card className="dashboard-card dashboard-stats">
								<Card.Body className="text-center">
									<h2 className="display-4 dashboard-stat-number">
										{stats.totalArticles}
									</h2>
									<Card.Title className="dashboard-stat-title">
										Total Articles
									</Card.Title>
								</Card.Body>
							</Card>
						</Col>
						<Col md={4} className="mb-3">
							<Card className="dashboard-card dashboard-stats">
								<Card.Body className="text-center">
									<h2 className="display-4 dashboard-stat-number">
										{stats.moderators}
									</h2>
									<Card.Title className="dashboard-stat-title">
										Moderators
									</Card.Title>
								</Card.Body>
							</Card>
						</Col>
					</Row>

					<Row className="mb-4">
						<Col lg={6} className="mb-4">
							<Card className="dashboard-card">
								<Card.Header className="dashboard-card-header">
									<h3>Initiate Chat with User</h3>
								</Card.Header>
								<Card.Body>
									<Form onSubmit={handleStartChat}>
										<Form.Group className="mb-3">
											<Form.Label>Select User</Form.Label>
											<Form.Select
												value={selectedUser}
												onChange={handleUserSelect}
												className="dashboard-select"
											>
												<option value="">Select a user...</option>
												{users.map((user) => (
													<option key={user.id} value={user.id}>
														{user.username} ({user.email})
													</option>
												))}
											</Form.Select>
										</Form.Group>
										<Form.Group className="mb-3">
											<Form.Label>Initial Message</Form.Label>
											<Form.Control
												as="textarea"
												rows={5}
												value={message}
												onChange={handleMessageChange}
												placeholder="Type your message here..."
												className="dashboard-textarea"
											/>
										</Form.Group>
										<Button
											variant="primary"
											type="submit"
											className="dashboard-button"
										>
											Start Chat
										</Button>
									</Form>
								</Card.Body>
							</Card>
						</Col>

						<Col lg={6}>
							<Card className="dashboard-card">
								<Card.Header className="dashboard-card-header">
									<h3>Quick Actions</h3>
								</Card.Header>
								<Card.Body>
									<div className="dashboard-action-item">
										<h4>Manage Users</h4>
										<p>View, edit, and manage user accounts and permissions.</p>
									</div>
									<div className="dashboard-action-item">
										<h4>Manage Articles</h4>
										<p>Add, edit, or delete articles and content.</p>
									</div>
									<div className="dashboard-action-item">
										<h4>Review Reports</h4>
										<p>Review and handle reported content and users.</p>
									</div>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Container>
			</div>
		</div>
	);
};

export default DashboardPage;
