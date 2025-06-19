import React, { useEffect, useState } from "react";
import { fetchPlan } from "../../services/PlanService";
import { useParams, useNavigate } from "react-router-dom";
import "./PlanDetail.css";

export default function PlanDetail() {
	const { planId } = useParams();
	const navigate = useNavigate();
	const [plan, setPlan] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("overview");

	useEffect(() => {
		setLoading(true);
		fetchPlan(planId)
			.then((res) => {
				setPlan(res.data);
				setLoading(false);
			})
			.catch((err) => {
				console.error("Error fetching plan:", err);
				setLoading(false);
			});
	}, [planId]);

	if (loading) {
		return (
			<div className="container mt-5 text-center">
				<div className="spinner-border" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
				<p className="mt-2">Loading workout plan...</p>
			</div>
		);
	}

	if (!plan) {
		return (
			<div className="container mt-5">
				<div className="alert alert-warning">
					Plan not found or could not be loaded.
				</div>
				<button className="btn btn-primary" onClick={() => navigate("/plans")}>
					Back to Plans
				</button>
			</div>
		);
	}

	// Extract YouTube video IDs from URLs
	const getYouTubeId = (url) => {
		if (!url) return null;
		const regExp =
			/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? match[2] : null;
	};

	return (
		<div className="container mt-5 plan-detail-container">
			<button className="btn btn-link mb-3" onClick={() => navigate(-1)}>
				&larr; Back to Plans
			</button>

			<div className="card shadow-sm mb-4">
				<div className="card-header bg-primary text-white">
					<h2 className="mb-0">{plan.title}</h2>
				</div>
				<div className="card-body">
					<div className="mb-4">
						<ul className="nav nav-tabs">
							<li className="nav-item">
								<button
									className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
									onClick={() => setActiveTab("overview")}
								>
									Overview
								</button>
							</li>
							<li className="nav-item">
								<button
									className={`nav-link ${activeTab === "schedule" ? "active" : ""}`}
									onClick={() => setActiveTab("schedule")}
								>
									Workout Schedule
								</button>
							</li>
							{plan.media && plan.media.length > 0 && (
								<li className="nav-item">
									<button
										className={`nav-link ${activeTab === "videos" ? "active" : ""}`}
										onClick={() => setActiveTab("videos")}
									>
										Exercise Videos
									</button>
								</li>
							)}
						</ul>
					</div>

					{activeTab === "overview" && (
						<div className="overview-tab">
							{plan.description && (
								<div className="mb-4">
									<h5>Description</h5>
									<p>{plan.description}</p>
								</div>
							)}

							<div className="row mb-4">
								{plan.difficulty && (
									<div className="col-md-4">
										<div className="card h-100">
											<div className="card-body">
												<h6 className="card-title">Difficulty</h6>
												<p className="card-text">
													<span
														className={`badge ${
															plan.difficulty === "Beginner"
																? "bg-success"
																: plan.difficulty === "Intermediate"
																	? "bg-warning"
																	: "bg-danger"
														}`}
													>
														{plan.difficulty}
													</span>
												</p>
											</div>
										</div>
									</div>
								)}

								{plan.targetMuscleGroups && (
									<div className="col-md-4">
										<div className="card h-100">
											<div className="card-body">
												<h6 className="card-title">Target Muscle Groups</h6>
												<p className="card-text">{plan.targetMuscleGroups}</p>
											</div>
										</div>
									</div>
								)}

								{plan.estimatedDurationMinutes && (
									<div className="col-md-4">
										<div className="card h-100">
											<div className="card-body">
												<h6 className="card-title">Duration</h6>
												<p className="card-text">
													{plan.estimatedDurationMinutes} minutes
												</p>
											</div>
										</div>
									</div>
								)}
							</div>

							<div className="mb-3">
								<small className="text-muted">
									Created at: {new Date(plan.createdAt).toLocaleString()}
								</small>
							</div>
						</div>
					)}

					{activeTab === "schedule" && (
						<div className="schedule-tab">
							<div className="workout-details">
								{plan.details.map((detail, index) => (
									<div key={index} className="workout-day mb-3">
										<div className="day-header">
											{detail.startsWith("Day") ? (
												<h5>{detail.split(":")[0]}</h5>
											) : (
												<h5>Day {index + 1}</h5>
											)}
										</div>
										<div className="day-content p-3">
											{detail.includes(":")
												? detail.split(":").slice(1).join(":")
												: detail}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{activeTab === "videos" && plan.media && (
						<div className="videos-tab">
							<div className="row">
								{plan.media.map((item, index) => (
									<div key={index} className="col-md-6 mb-4">
										<div className="card h-100">
											<div className="card-body">
												<h5 className="card-title">{item.exerciseName}</h5>
												<p className="card-text">{item.title}</p>

												{item.type === "youtube" && getYouTubeId(item.url) && (
													<div className="ratio ratio-16x9 mb-3">
														<iframe
															src={`https://www.youtube.com/embed/${getYouTubeId(item.url)}`}
															title={item.title}
															allowFullScreen
														></iframe>
													</div>
												)}

												{item.type === "image" && (
													<img
														src={item.url}
														alt={item.title}
														className="img-fluid rounded"
													/>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
