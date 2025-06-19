// src/info_news/pages/General.jsx

import React, { useEffect, useState } from "react";
import { API } from "../../services/api";
import "./NewsPage.css"; // Reuse the same CSS as other Info News pages
import Pagination from "../components/Pagination";
import ContentRenderer from "../components/ContentRenderer";
// import { Link } from 'react-router-dom';

export default function General() {
	const [articles, setArticles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedArticle, setSelectedArticle] = useState(null);
	const [viewMode, setViewMode] = useState("list");

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(6);

	useEffect(() => {
		const fetchArticles = async () => {
			try {
				setLoading(true);
				// Endpoint for category "general"
				const response = await API.get("/api/articles/general");
				if (response.data && Array.isArray(response.data.data)) {
					setArticles(response.data.data);
				} else {
					setError("No articles found for General Health.");
				}
			} catch (err) {
				console.error("Error fetching general articles:", err);
				setError("Unable to load General Health articles. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		fetchArticles();
	}, []);

	// Markdown rendering via ContentRenderer
	const renderContent = (chunk, index) => {
		return <ContentRenderer key={index} content={chunk} />;
	};

	// Switch to detail view
	const showArticleDetail = (article) => {
		setSelectedArticle(article);
		setViewMode("detail");
		window.scrollTo(0, 0);
	};

	// Back to list view
	const backToList = () => {
		setViewMode("list");
		setSelectedArticle(null);
	};

	// Pagination logic
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentArticles = articles.slice(indexOfFirstItem, indexOfLastItem);
	const paginate = (pageNumber) => {
		setCurrentPage(pageNumber);
		window.scrollTo(0, 0);
	};

	// Render list of “General” articles
	const renderArticlesList = () => (
		<>
			<h1 className="mb-4">General Health</h1>
			<div className="row mb-4">
				<div className="col-12">
					<div className="card category-card">
						<div className="card-body d-flex align-items-center">
							<div className="category-icon bg-primary text-white p-3 rounded me-3">
								<i className="fas fa-heart fa-2x" />
							</div>
							<div>
								<h3 className="card-title">
									General health topics: prevention, wellness, and everyday tips
								</h3>
								<p className="card-text">
									Explore broad health topics ranging from lifestyle advice to
									preventive care recommendations.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{currentArticles.length > 0 ? (
				<div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
					{currentArticles.map((article, idx) => (
						<div className="col" key={article.id || `general-${idx}`}>
							<div className="card h-100 article-card">
								{article.imageUrl && (
									<img
										src={article.imageUrl}
										className="card-img-top article-image"
										alt={article.title}
										onError={(e) => {
											e.target.onerror = null;
											e.target.src = "/placeholder-image.jpg";
										}}
									/>
								)}
								<div className="card-body d-flex flex-column">
									<h5
										className="card-title"
										style={{ cursor: "pointer" }}
										onClick={() => showArticleDetail(article)}
									>
										{article.title}
									</h5>
									{article.publishedDate && (
										<p className="card-text text-muted mb-2">
											<small>
												{new Date(article.publishedDate).toLocaleDateString()}
											</small>
										</p>
									)}
									<p className="card-text article-excerpt flex-grow-1">
										{article.description
											? article.description.length > 120
												? `${article.description.substring(0, 120)}...`
												: article.description
											: "No description available."}
									</p>
									<button
										className="btn btn-outline-primary mt-3 align-self-start"
										onClick={() => showArticleDetail(article)}
									>
										Read More
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<p>No General Health articles available.</p>
			)}

			<Pagination
				itemsPerPage={itemsPerPage}
				totalItems={articles.length}
				currentPage={currentPage}
				paginate={paginate}
			/>
		</>
	);

	// Render a single “General” article detail
	const renderArticleDetail = () => {
		if (!selectedArticle) return null;

		const contentChunks = selectedArticle.content
			? selectedArticle.content.split(/\n{2,}/).filter((c) => c.trim() !== "")
			: ["No content available."];

		return (
			<div className="article-detail">
				<button className="btn btn-outline-secondary mb-3" onClick={backToList}>
					&larr; Back to list
				</button>

				<h1 className="article-detail-title">{selectedArticle.title}</h1>

				<div className="article-detail-meta mb-3">
					{selectedArticle.publishedDate && (
						<span className="article-date me-3">
							{new Date(selectedArticle.publishedDate).toLocaleDateString()}
						</span>
					)}
					{selectedArticle.source && (
						<span className="article-source me-3">
							Source: {selectedArticle.source}
						</span>
					)}
					{selectedArticle.url && (
						<a
							href={selectedArticle.url}
							target="_blank"
							rel="noopener noreferrer"
							className="article-original-link"
						>
							View Original
						</a>
					)}
				</div>

				<div className="article-content markdown-content">
					{contentChunks.map((chunk, index) => renderContent(chunk, index))}
				</div>
			</div>
		);
	};

	// Main render
	if (loading) {
		return (
			<div className="container mt-5">
				<div className="text-center">
					<div className="spinner-border" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
					<p className="mt-2">Loading articles...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mt-5">
				<div className="alert alert-danger" role="alert">
					{error}
				</div>
			</div>
		);
	}

	return (
		<div className="container mt-5">
			{viewMode === "list" ? renderArticlesList() : renderArticleDetail()}
		</div>
	);
}
