// src/dashboard/pages/ArticlesPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Form, InputGroup, Modal } from "react-bootstrap";
import { FaSearch, FaEdit, FaTrash, FaEye, FaPlus } from "react-icons/fa";
import AdminService from "../../services/adminService";
import "../DashboardPages.css";

// List of popular article categories (in English)
const DEFAULT_ARTICLE_CATEGORIES = [
	"Health",
	"Nutrition",
	"Workout",
	"Yoga",
	"Weight Loss",
	"Weight Gain",
	"Bodybuilding",
	"Cardio",
	"Meditation",
	"Sports Nutrition",
	"Supplements",
	"Injury",
	"Recovery",
	"Sports Psychology",
	"News",
];

const ArticlesPage = () => {
	const [articles, setArticles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [categories, setCategories] = useState(DEFAULT_ARTICLE_CATEGORIES);
	const [newCategory, setNewCategory] = useState("");
	const [showCategoryInput, setShowCategoryInput] = useState(false);

	// Article modal state
	const [showArticleModal, setShowArticleModal] = useState(false);
	const [editingArticle, setEditingArticle] = useState(null);
	const [articleFormData, setArticleFormData] = useState({
		title: "",
		content: "",
		description: "",
		category: "",
		imageUrl: "",
		isActive: true,
	});

	const fetchArticles = useCallback(async () => {
		try {
			setLoading(true);
			console.log("Fetching articles...");
			const response = await AdminService.getAllArticles();
			console.log("Articles response:", response);

			// Nếu có searchTerm, lọc kết quả ở phía client
			let filteredArticles = response.data.content || response.data;

			if (searchTerm.trim() !== "") {
				const searchLower = searchTerm.toLowerCase();
				filteredArticles = filteredArticles.filter(
					(article) =>
						article.title.toLowerCase().includes(searchLower) ||
						(article.description &&
							article.description.toLowerCase().includes(searchLower)) ||
						(article.category &&
							article.category.toLowerCase().includes(searchLower)),
				);
			}

			setArticles(filteredArticles);
			setTotalPages(response.data.totalPages || 1);
			setError(null);
		} catch (err) {
			console.error("Error fetching articles:", err);
			setError(
				`Failed to fetch articles: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
			);
		} finally {
			setLoading(false);
		}
	}, [searchTerm]);

	useEffect(() => {
		fetchArticles();

		// Tải danh sách categories từ localStorage nếu có
		const savedCategories = localStorage.getItem("articleCategories");
		if (savedCategories) {
			setCategories(JSON.parse(savedCategories));
		}
	}, [fetchArticles]);

	const handleSearch = (e) => {
		e.preventDefault();
		setCurrentPage(1);
		fetchArticles();
	};

	const handlePageChange = (newPage) => {
		setCurrentPage(newPage);
	};

	const handleDeleteArticle = async (articleId) => {
		if (window.confirm("Are you sure you want to delete this article?")) {
			try {
				await AdminService.deleteArticle(articleId);
				fetchArticles();
			} catch (err) {
				console.error("Error deleting article:", err);
				alert(
					`Failed to delete article: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
				);
			}
		}
	};

	const handleOpenArticleModal = (article = null) => {
		if (article) {
			setEditingArticle(article);
			setArticleFormData({
				title: article.title,
				content: article.content,
				description: article.description || "",
				category: article.category || "",
				imageUrl: article.imageUrl || "",
				isActive: article.isActive !== false, // Mặc định là true nếu không có giá trị
			});
		} else {
			setEditingArticle(null);
			setArticleFormData({
				title: "",
				content: "",
				description: "",
				category: "",
				imageUrl: "",
				isActive: true,
			});
		}
		setShowArticleModal(true);
	};

	const handleCloseArticleModal = () => {
		setShowArticleModal(false);
		setShowCategoryInput(false);
	};

	const handleArticleFormChange = (e) => {
		const { name, value, type, checked } = e.target;
		setArticleFormData({
			...articleFormData,
			[name]: type === "checkbox" ? checked : value,
		});
	};

	const handleArticleSubmit = async (e) => {
		e.preventDefault();
		try {
			if (editingArticle) {
				await AdminService.updateArticle(editingArticle.id, articleFormData);
			} else {
				await AdminService.createArticle(articleFormData);
			}
			fetchArticles();
			handleCloseArticleModal();
		} catch (err) {
			console.error("Error saving article:", err);
			alert(
				`Failed to ${editingArticle ? "update" : "create"} article: ${err.response?.status === 403 ? "Permission denied" : err.message}`,
			);
		}
	};

	const handleAddCategory = () => {
		if (newCategory.trim() !== "" && !categories.includes(newCategory.trim())) {
			const updatedCategories = [...categories, newCategory.trim()];
			setCategories(updatedCategories);
			setNewCategory("");

			// Lưu danh sách categories mới vào localStorage
			localStorage.setItem(
				"articleCategories",
				JSON.stringify(updatedCategories),
			);
		}
		setShowCategoryInput(false);
	};

	const handleViewArticle = (articleId) => {
		window.open(`/info-news/${articleId}`, "_blank");
	};

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		const options = { year: "numeric", month: "short", day: "numeric" };
		return new Date(dateString).toLocaleDateString(undefined, options);
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
			<h1 className="dashboard-page-title">Article Management</h1>

			<div className="d-flex justify-content-between align-items-center mb-4">
				<Form onSubmit={handleSearch} className="d-flex dashboard-search">
					<InputGroup>
						<Form.Control
							type="text"
							placeholder="Search articles..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="dashboard-form-control"
						/>
						<Button variant="primary" type="submit">
							<FaSearch />
						</Button>
					</InputGroup>
				</Form>
				<Button variant="success" onClick={() => handleOpenArticleModal()}>
					<FaPlus className="me-2" />
					Add New Article
				</Button>
			</div>

			<Table striped bordered hover responsive className="dashboard-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Title</th>
						<th>Category</th>
						<th>Author</th>
						<th>Created Date</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{articles.map((article) => (
						<tr key={article.id}>
							<td>{article.id}</td>
							<td className="article-title-cell">{article.title}</td>
							<td>{article.category}</td>
							<td>{article.author || "Unknown"}</td>
							<td>{formatDate(article.createdAt)}</td>
							<td>
								<span
									className={`badge ${article.isActive ? "bg-success" : "bg-warning"}`}
								>
									{article.isActive ? "Active" : "Inactive"}
								</span>
							</td>
							<td>
								<Button
									variant="outline-info"
									size="sm"
									className="me-2 dashboard-action-btn"
									title="View Article"
									onClick={() => handleViewArticle(article.id)}
								>
									<FaEye />
								</Button>
								<Button
									variant="outline-primary"
									size="sm"
									className="me-2 dashboard-action-btn"
									title="Edit Article"
									onClick={() => handleOpenArticleModal(article)}
								>
									<FaEdit />
								</Button>
								<Button
									variant="outline-danger"
									size="sm"
									className="dashboard-action-btn"
									onClick={() => handleDeleteArticle(article.id)}
									title="Delete Article"
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

			{/* Article Modal */}
			<Modal show={showArticleModal} onHide={handleCloseArticleModal} size="lg">
				<Modal.Header closeButton>
					<Modal.Title>
						{editingArticle ? "Edit Article" : "Create New Article"}
					</Modal.Title>
				</Modal.Header>
				<Form onSubmit={handleArticleSubmit}>
					<Modal.Body>
						<Form.Group className="mb-3">
							<Form.Label>Title</Form.Label>
							<Form.Control
								type="text"
								name="title"
								value={articleFormData.title}
								onChange={handleArticleFormChange}
								required
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Description</Form.Label>
							<Form.Control
								as="textarea"
								rows={2}
								name="description"
								value={articleFormData.description}
								onChange={handleArticleFormChange}
								placeholder="Brief description of the article"
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Content</Form.Label>
							<Form.Control
								as="textarea"
								rows={10}
								name="content"
								value={articleFormData.content}
								onChange={handleArticleFormChange}
								required
							/>
							<Form.Text className="text-muted">
								You can use Markdown formatting
							</Form.Text>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Category</Form.Label>
							{!showCategoryInput ? (
								<div className="d-flex">
									<Form.Select
										name="category"
										value={articleFormData.category}
										onChange={handleArticleFormChange}
										required
										className="me-2"
									>
										<option value="">Select a category</option>
										{categories.map((category) => (
											<option key={category} value={category}>
												{category}
											</option>
										))}
									</Form.Select>
									<Button
										variant="outline-secondary"
										onClick={() => setShowCategoryInput(true)}
										title="Add new category"
									>
										<FaPlus />
									</Button>
								</div>
							) : (
								<div className="d-flex">
									<Form.Control
										type="text"
										placeholder="Enter new category"
										value={newCategory}
										onChange={(e) => setNewCategory(e.target.value)}
										className="me-2"
									/>
									<Button
										variant="success"
										onClick={handleAddCategory}
										disabled={!newCategory.trim()}
									>
										Add
									</Button>
									<Button
										variant="outline-secondary"
										onClick={() => setShowCategoryInput(false)}
										className="ms-2"
									>
										Cancel
									</Button>
								</div>
							)}
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Label>Image URL</Form.Label>
							<Form.Control
								type="text"
								name="imageUrl"
								value={articleFormData.imageUrl}
								onChange={handleArticleFormChange}
								placeholder="URL to the article's main image"
							/>
						</Form.Group>
						<Form.Group className="mb-3">
							<Form.Check
								type="checkbox"
								name="isActive"
								label="Active (Published)"
								checked={articleFormData.isActive}
								onChange={handleArticleFormChange}
							/>
							<Form.Text className="text-muted">
								Active articles are visible to users. Inactive articles are
								saved as drafts.
							</Form.Text>
						</Form.Group>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={handleCloseArticleModal}>
							Cancel
						</Button>
						<Button variant="primary" type="submit">
							{editingArticle ? "Update" : "Create"} Article
						</Button>
					</Modal.Footer>
				</Form>
			</Modal>
		</div>
	);
};

export default ArticlesPage;
