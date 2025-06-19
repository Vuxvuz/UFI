// src/dashboard/pages/ReportsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, Alert, Spinner } from "react-bootstrap";
import { FaTrash, FaCheck, FaSync } from "react-icons/fa";
import ReportService from "../../services/reportService";
import useAuth from "../../auth/hooks/useAuth";
import "../DashboardPages.css";

export default function ReportsPage() {
	const { roles } = useAuth();
	const isAdmin = roles.includes("ROLE_ADMIN");
	const isMod = roles.includes("ROLE_MODERATOR");

	const [reports, setReports] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [refreshing, setRefreshing] = useState(false);

	const fetchReports = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			if (isAdmin) {
				console.log("Fetching reports as admin");
				const res = await ReportService.getPendingReportsForAdmin();
				console.log("Admin reports response:", res);
				setReports(res.data);
			} else if (isMod) {
				console.log("Fetching reports as moderator");
				const res = await ReportService.getPendingReportsForMod();
				console.log("Moderator reports response:", res);
				setReports(res.data);
			}
		} catch (err) {
			console.error("Error fetching reports:", err);
			setError(
				`Failed to load reports: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
			);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [isAdmin, isMod]);

	useEffect(() => {
		fetchReports();
	}, [fetchReports]);

	const handleRefresh = () => {
		setRefreshing(true);
		fetchReports();
	};

	const handleReview = async (reportId, action) => {
		try {
			if (isAdmin) {
				await ReportService.reviewReportAsAdmin(reportId, action);
			} else {
				await ReportService.reviewReportAsMod(reportId, action);
			}
			alert("Action successful");
			fetchReports();
		} catch (err) {
			console.error(err);
			alert(
				`Failed to review report: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
			);
		}
	};

	if (loading && !refreshing) {
		return (
			<div className="text-center p-5 dashboard-page">
				<Spinner animation="border" role="status" variant="primary">
					<span className="visually-hidden">Loading...</span>
				</Spinner>
			</div>
		);
	}

	return (
		<div className="dashboard-page">
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h1 className="dashboard-page-title">Report Management</h1>
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

			{error && (
				<Alert
					variant="danger"
					className="dashboard-alert dashboard-alert-danger"
				>
					{error}
				</Alert>
			)}

			{!loading && !error && reports.length === 0 && (
				<Alert variant="info" className="dashboard-alert">
					No pending reports found.
				</Alert>
			)}

			{reports.length > 0 && (
				<Table striped bordered hover responsive className="dashboard-table">
					<thead>
						<tr>
							<th>ID</th>
							<th>Type</th>
							<th>Content</th>
							<th>Author</th>
							<th>Reported By</th>
							<th>Reason</th>
							<th>Created At</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{reports.map((report) => (
							<tr key={report.id}>
								<td>{report.id}</td>
								<td>
									<span
										className={`badge ${report.reportType === "POST" ? "bg-primary" : report.reportType === "ARTICLE" ? "bg-success" : "bg-warning"}`}
									>
										{report.reportType}
									</span>
								</td>
								<td>
									{report.reportType === "POST" && (
										<div>
											<strong>Post:</strong> {report.postSnippet}
										</div>
									)}
									{report.reportType === "ARTICLE" && (
										<div>
											<strong>Article:</strong> {report.articleTitle}
										</div>
									)}
									{report.reportType === "USER" && (
										<div>
											<strong>User Report</strong>
										</div>
									)}
								</td>
								<td>
									{report.reportType === "POST" && report.postAuthorUsername}
									{report.reportType === "ARTICLE" && report.articleAuthor}
									{report.reportType === "USER" && "-"}
								</td>
								<td>{report.reportedByUsername}</td>
								<td>{report.reason || "-"}</td>
								<td>{new Date(report.createdAt).toLocaleString()}</td>
								<td>
									<Button
										variant="outline-danger"
										size="sm"
										className="me-2 dashboard-action-btn"
										onClick={() => handleReview(report.id, "DELETE_POST")}
										title={
											report.reportType === "ARTICLE"
												? "Deactivate Article"
												: "Delete Post"
										}
									>
										<FaTrash />{" "}
										{report.reportType === "ARTICLE" ? "Deactivate" : "Delete"}
									</Button>
									<Button
										variant="outline-success"
										size="sm"
										className="dashboard-action-btn"
										onClick={() => handleReview(report.id, "IGNORE")}
										title="Ignore Report"
									>
										<FaCheck /> Ignore
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			)}
		</div>
	);
}
