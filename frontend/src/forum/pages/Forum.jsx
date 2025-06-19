import React, { useState, useEffect, useCallback } from "react";
import {
	listTopics,
	createTopic,
	listCategories,
	votePost,
} from "../../services/forumService";
import { Link } from "react-router-dom";
import CategoryBadge from "../components/CategoryBadge";

export default function Forum() {
	const [topics, setTopics] = useState([]);
	const [newTitle, setNewTitle] = useState("");
	const [newCat, setNewCat] = useState("ALL");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [categories, setCategories] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await listCategories();
				if (response.result === "SUCCESS" && response.data) {
					setCategories(response.data);
				}
			} catch (err) {
				console.error("Error fetching categories:", err);
			}
		};
		fetchCategories();
	}, []);

	const loadTopics = useCallback(async () => {
		try {
			const filter = newCat !== "ALL" ? newCat.toUpperCase() : null;
			const response = await listTopics(filter);
			console.log("Topics loaded:", response.data);
			if (response.data && response.result === "SUCCESS") {
				setTopics(response.data || []);
			} else {
				setTopics([]);
			}
		} catch (err) {
			console.error("Error loading topics:", err);
			setError("Failed to load topics");
		}
	}, [newCat]);

	useEffect(() => {
		loadTopics();
	}, [loadTopics]);

	const handleCreate = async (e) => {
		e.preventDefault();
		if (!newTitle.trim()) return;

		setIsSubmitting(true);
		try {
			await createTopic({
				title: newTitle.trim(),
				category: { name: newCat === "ALL" ? "GENERAL" : newCat },
			});
			setNewTitle("");
			await loadTopics();
		} catch (err) {
			console.error("Error creating topic:", err);
			setError("Failed to create topic");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleVote = async (topicId, isUpvote) => {
		try {
			console.log(`Voting: topicId=${topicId}, isUpvote=${isUpvote}`);
			const voteResponse = await votePost(topicId, isUpvote, "TOPIC");
			console.log("Vote response:", voteResponse);
			setTopics((prevTopics) =>
				prevTopics.map((topic) =>
					topic.id === topicId
						? {
								...topic,
								upvotes: voteResponse.data.upvotes || 0,
								downvotes: voteResponse.data.downvotes || 0,
								userVoteIsUpvote: voteResponse.data.voteId ? isUpvote : null,
							}
						: topic,
				),
			);
		} catch (error) {
			console.error("Error voting:", error);
			setError(`Error voting: ${error.message}`);
		}
	};

	const filteredTopics = topics.filter((topic) =>
		topic.title.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="container mt-4">
			<div className="row mb-4">
				<div className="col-md-8">
					<h2>Forum</h2>
				</div>
				<div className="col-md-4 text-end">
					<div className="d-flex my-3">
						<div className="input-group me-2">
							<input
								type="text"
								className="form-control"
								placeholder="Search topics..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<button
							className="btn btn-primary"
							data-bs-toggle="modal"
							data-bs-target="#createTopicModal"
						>
							Tạo Topic
						</button>
					</div>
				</div>
			</div>

			{error && (
				<div className="alert alert-danger">
					{error}
					<button
						className="btn btn-sm btn-outline-danger ms-2"
						onClick={() => setError("")}
					>
						Clear
					</button>
				</div>
			)}

			<div className="d-flex mb-4 align-items-center">
				<div className="dropdown me-2">
					<button
						className="btn btn-outline-secondary dropdown-toggle"
						type="button"
						id="categoryDropdown"
						data-bs-toggle="dropdown"
						aria-expanded="false"
					>
						{newCat === "ALL" ? "All Categories" : newCat}
					</button>
					<ul className="dropdown-menu" aria-labelledby="categoryDropdown">
						<li>
							<button
								type="button"
								className="dropdown-item"
								onClick={() => setNewCat("ALL")}
							>
								All Categories
							</button>
						</li>
						{categories.map((cat, index) => (
							<li key={index}>
								<button
									type="button"
									className="dropdown-item"
									onClick={() => setNewCat(cat.name)}
								>
									{cat.name}
								</button>
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className="list-group">
				{filteredTopics.length === 0 ? (
					<div className="text-center p-3">No topics found</div>
				) : (
					filteredTopics.map((topic) => (
						<div
							key={topic.id}
							className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
						>
							<div className="d-flex align-items-center">
								<div className="d-flex flex-column align-items-center me-3">
									<button
										className={`btn btn-sm ${topic.userVoteIsUpvote === true ? "btn-success" : "btn-outline-secondary"}`}
										onClick={() => handleVote(topic.id, true)}
									>
										<i className="fa fa-arrow-up"></i>
									</button>
									<span className="my-1">
										{(topic.upvotes || 0) - (topic.downvotes || 0)}
									</span>
									<button
										className={`btn btn-sm ${topic.userVoteIsUpvote === false ? "btn-danger" : "btn-outline-secondary"}`}
										onClick={() => handleVote(topic.id, false)}
									>
										<i className="fa fa-arrow-down"></i>
									</button>
								</div>
								<div>
									<Link to={`/forum/${topic.id}`} className="topic-title">
										{topic.title}
									</Link>
									<div>
										<CategoryBadge category={topic.category} />
										<small className="text-muted ms-2">by {topic.author}</small>
									</div>
								</div>
							</div>
							<span className="text-muted">
								{new Date(topic.createdAt).toLocaleDateString()}
							</span>
						</div>
					))
				)}
			</div>

			<div
				className="modal fade"
				id="createTopicModal"
				tabIndex="-1"
				aria-hidden="true"
			>
				<div className="modal-dialog">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">Create New Topic</h5>
							<button
								type="button"
								className="btn-close"
								data-bs-dismiss="modal"
								aria-label="Close"
							></button>
						</div>
						<div className="modal-body">
							<form onSubmit={handleCreate}>
								<div className="mb-3">
									<label htmlFor="topicTitle" className="form-label">
										Topic Title
									</label>
									<input
										type="text"
										className="form-control"
										id="topicTitle"
										value={newTitle}
										onChange={(e) => setNewTitle(e.target.value)}
										required
									/>
								</div>
								<div className="mb-3">
									<label htmlFor="topicCategory" className="form-label">
										Category
									</label>
									<select
										className="form-select"
										id="topicCategory"
										value={newCat}
										onChange={(e) => setNewCat(e.target.value)}
									>
										<option value="ALL">All</option>
										{categories.map((c, index) => (
											<option key={index} value={c.name}>
												{c.name}
											</option>
										))}
									</select>
								</div>
								<div className="modal-footer">
									<button
										type="button"
										className="btn btn-secondary"
										data-bs-dismiss="modal"
									>
										Cancel
									</button>
									<button
										type="submit"
										className="btn btn-primary"
										disabled={!newTitle.trim() || isSubmitting}
									>
										{isSubmitting ? "Creating..." : "Create Topic"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
