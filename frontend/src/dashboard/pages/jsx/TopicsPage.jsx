// src/dashboard/pages/TopicsPage.jsx

import React, { useEffect, useState } from "react";
import topicService from "../../services/topicService";
import categoryService from "../../services/categoryService";

export default function TopicsPage() {
	const [topics, setTopics] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [categories, setCategories] = useState([]);
	const [newTopic, setNewTopic] = useState({
		title: "",
		categoryName: "",
	});

	// Load topics
	const loadTopics = async () => {
		setLoading(true);
		try {
			const res = await topicService.getAll();
			console.log("Topics API response:", res);

			if (res.data && Array.isArray(res.data)) {
				setTopics(res.data);
			} else if (res.data && res.data.data && Array.isArray(res.data.data)) {
				setTopics(res.data.data);
			} else {
				console.error("Unexpected API response format:", res);
				setTopics([]);
			}
		} catch (err) {
			console.error("Error loading topics:", err);
			setError("Failed to load topics.");
		} finally {
			setLoading(false);
		}
	};

	// Load categories for the dropdown
	const loadCategories = async () => {
		try {
			const res = await categoryService.getAllCategoriesForMod();
			console.log("Categories API response:", res);

			if (res.data && Array.isArray(res.data)) {
				setCategories(res.data);
			} else if (res.data && res.data.data && Array.isArray(res.data.data)) {
				setCategories(res.data.data);
			} else {
				console.error("Unexpected categories API response format:", res);
				setCategories([]);
			}
		} catch (err) {
			console.error("Error loading categories:", err);
		}
	};

	useEffect(() => {
		loadTopics();
		loadCategories();
	}, []);

	// Handle input changes
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setNewTopic((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Create new topic
	const handleCreateTopic = async (e) => {
		e.preventDefault();

		if (!newTopic.title.trim()) {
			setError("Topic title cannot be empty");
			return;
		}

		if (!newTopic.categoryName) {
			setError("Please select a category");
			return;
		}

		try {
			await topicService.createTopic({
				title: newTopic.title,
				category: { name: newTopic.categoryName },
			});

			setNewTopic({
				title: "",
				categoryName: "",
			});

			setSuccess("Topic created successfully");
			setError("");
			loadTopics(); // Reload topics
		} catch (err) {
			console.error("Error creating topic:", err);
			// Extract error message from different possible response formats
			const errorMessage =
				err.response?.data?.message ||
				err.response?.data?.data?.message ||
				(err.response?.data?.result === "ERROR"
					? err.response?.data?.message
					: null) ||
				"Failed to create topic";
			setError(errorMessage);
		}
	};

	// Delete a topic
	const handleDeleteTopic = async (topicId, topicTitle) => {
		if (
			window.confirm(`Are you sure you want to delete topic "${topicTitle}"?`)
		) {
			try {
				await topicService.deleteTopic(topicId);
				setSuccess("Topic deleted successfully");
				setError("");
				loadTopics(); // Reload topics
			} catch (err) {
				console.error("Error deleting topic:", err);
				// Extract error message from different possible response formats
				const errorMessage =
					err.response?.data?.message ||
					err.response?.data?.data?.message ||
					(err.response?.data?.result === "ERROR"
						? err.response?.data?.message
						: null) ||
					"Failed to delete topic";
				setError(errorMessage);
			}
		}
	};

	// Clear messages after 5 seconds
	useEffect(() => {
		if (success || error) {
			const timer = setTimeout(() => {
				setSuccess("");
				setError("");
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [success, error]);

	if (loading) return <div className="alert alert-info">Loading topics...</div>;

	return (
		<div className="container mt-4">
			<h2>Manage Topics</h2>

			{/* Success and Error Messages */}
			{success && <div className="alert alert-success">{success}</div>}
			{error && <div className="alert alert-danger">{error}</div>}

			{/* Create New Topic Form */}
			<div className="card mb-4">
				<div className="card-header">Create New Topic</div>
				<div className="card-body">
					<form onSubmit={handleCreateTopic}>
						<div className="mb-3">
							<label htmlFor="title" className="form-label">
								Topic Title
							</label>
							<input
								type="text"
								className="form-control"
								id="title"
								name="title"
								value={newTopic.title}
								onChange={handleInputChange}
								placeholder="Enter topic title"
							/>
						</div>
						<div className="mb-3">
							<label htmlFor="categoryName" className="form-label">
								Category
							</label>
							<select
								className="form-select"
								id="categoryName"
								name="categoryName"
								value={newTopic.categoryName}
								onChange={handleInputChange}
							>
								<option value="">Select a category</option>
								{categories.map((cat) => (
									<option key={cat.id} value={cat.name}>
										{cat.name}
									</option>
								))}
							</select>
						</div>
						<button type="submit" className="btn btn-primary">
							Create Topic
						</button>
					</form>
				</div>
			</div>

			{/* Topics List */}
			<div className="card">
				<div className="card-header">Topics</div>
				<div className="card-body">
					{!topics.length ? (
						<div className="alert alert-warning">No topics found.</div>
					) : (
						<table className="table table-striped">
							<thead>
								<tr>
									<th>ID</th>
									<th>Title</th>
									<th>Author</th>
									<th>Category</th>
									<th>Created</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{topics.map((topic) => (
									<tr key={topic.id}>
										<td>{topic.id}</td>
										<td>{topic.title}</td>
										<td>{topic.author}</td>
										<td>{topic.category?.name || "N/A"}</td>
										<td>{new Date(topic.createdAt).toLocaleDateString()}</td>
										<td>
											<button
												className="btn btn-primary btn-sm me-2"
												onClick={() =>
													window.open(`/forum/topics/${topic.id}`, "_blank")
												}
											>
												View
											</button>
											<button
												className="btn btn-danger btn-sm"
												onClick={() => handleDeleteTopic(topic.id, topic.title)}
											>
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</div>
	);
}
