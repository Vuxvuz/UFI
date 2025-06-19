import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import { FaSync } from "react-icons/fa";
import AdminService from "../../services/adminService";
import "../DashboardPages.css";

const SystemInfoPage = () => {
	const [systemInfo, setSystemInfo] = useState({
		javaVersion: "",
		springVersion: "",
		osName: "",
		osVersion: "",
		dbInfo: "",
		memoryUsage: "",
		uptime: "",
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [refreshing, setRefreshing] = useState(false);

	const fetchSystemInfo = useCallback(async () => {
		try {
			setLoading(true);
			console.log("Fetching system info...");
			const response = await AdminService.getSystemInfo();
			console.log("System info response:", response);
			setSystemInfo(response.data);
			setError(null);
		} catch (err) {
			console.error("Error fetching system info:", err);
			setError(
				`Failed to fetch system information: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
			);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleRefresh = async () => {
		setRefreshing(true);
		try {
			await fetchSystemInfo();
		} finally {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchSystemInfo();
	}, [fetchSystemInfo]);

	if (loading && !refreshing) {
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
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h1 className="dashboard-page-title">System Information</h1>
				<Button
					variant="outline-primary"
					onClick={handleRefresh}
					disabled={refreshing}
				>
					{refreshing ? (
						<>
							<FaSync className="me-2 fa-spin" /> Refreshing...
						</>
					) : (
						<>
							<FaSync className="me-2" /> Refresh
						</>
					)}
				</Button>
			</div>

			<Row>
				<Col md={6} className="mb-4">
					<Card className="dashboard-card system-info-card">
						<Card.Header className="dashboard-card-header">
							<h3>Application Info</h3>
						</Card.Header>
						<Card.Body>
							<div className="mb-3">
								<h4 className="system-info-title">Java Version</h4>
								<div className="system-info-value">
									{systemInfo.javaVersion}
								</div>
							</div>
							<div className="mb-3">
								<h4 className="system-info-title">Spring Version</h4>
								<div className="system-info-value">
									{systemInfo.springVersion}
								</div>
							</div>
							<div>
								<h4 className="system-info-title">Uptime</h4>
								<div className="system-info-value">{systemInfo.uptime}</div>
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col md={6} className="mb-4">
					<Card className="dashboard-card system-info-card">
						<Card.Header className="dashboard-card-header">
							<h3>Operating System</h3>
						</Card.Header>
						<Card.Body>
							<div className="mb-3">
								<h4 className="system-info-title">OS Name</h4>
								<div className="system-info-value">{systemInfo.osName}</div>
							</div>
							<div>
								<h4 className="system-info-title">OS Version</h4>
								<div className="system-info-value">{systemInfo.osVersion}</div>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			<Row>
				<Col md={6} className="mb-4">
					<Card className="dashboard-card system-info-card">
						<Card.Header className="dashboard-card-header">
							<h3>Database Info</h3>
						</Card.Header>
						<Card.Body>
							<div>
								<h4 className="system-info-title">Database</h4>
								<div className="system-info-value">{systemInfo.dbInfo}</div>
							</div>
						</Card.Body>
					</Card>
				</Col>

				<Col md={6} className="mb-4">
					<Card className="dashboard-card system-info-card">
						<Card.Header className="dashboard-card-header">
							<h3>Memory Usage</h3>
						</Card.Header>
						<Card.Body>
							<div>
								<h4 className="system-info-title">Memory</h4>
								<div className="system-info-value">
									{systemInfo.memoryUsage}
								</div>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default SystemInfoPage;
