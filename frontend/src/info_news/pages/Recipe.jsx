// src/info_news/pages/Recipe.jsx

import React, { useEffect, useState } from "react";
import { API } from "../../services/api";
import "./NewsPage.css"; // CSS chung cho Info News
import Pagination from "../components/Pagination";
import ContentRenderer from "../components/ContentRenderer";

export default function Recipe() {
	const [articles, setArticles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedArticle, setSelectedArticle] = useState(null);
	const [viewMode, setViewMode] = useState("list");

	// Phân trang
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(6);

	useEffect(() => {
		const fetchArticles = async () => {
			try {
				setLoading(true);
				const response = await API.get("/api/articles/recipes");
				setArticles(response.data.data || []);
			} catch (err) {
				console.error("Error fetching recipes articles:", err);
				setError("Không thể tải bài viết Recipes. Vui lòng thử lại.");
			} finally {
				setLoading(false);
			}
		};

		fetchArticles();
	}, []);

	// Chuyển list ↔ detail
	const showArticleDetail = (article) => {
		setSelectedArticle(article);
		setViewMode("detail");
		window.scrollTo(0, 0);
	};
	const backToList = () => {
		setViewMode("list");
		setSelectedArticle(null);
	};

	// Phân trang
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentArticles = articles.slice(indexOfFirstItem, indexOfLastItem);
	const paginate = (pageNumber) => {
		setCurrentPage(pageNumber);
		window.scrollTo(0, 0);
	};

	// Render danh sách Recipes (list view)
	const renderArticlesList = () => (
		<>
			<h1 className="mb-4">Recipes</h1>

			<div className="row mb-4">
				<div className="col-md-12">
					<div className="card category-card">
						<div className="card-body d-flex align-items-center">
							<div className="category-icon bg-success text-white p-3 rounded me-3">
								<i className="fas fa-utensils fa-2x"></i>
							</div>
							<div>
								<h3 className="card-title">Discover Healthy Recipes</h3>
								<p className="card-text">
									Explore a variety of healthy recipes, including ingredients,
									preparation steps, and nutritional information.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{currentArticles.length > 0 ? (
				<div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
					{currentArticles.map((article, idx) => (
						<div className="col" key={article.id || `recipe-${idx}`}>
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
									<p className="card-text text-muted mb-2">
										{article.publishedDate && (
											<small>
												{new Date(article.publishedDate).toLocaleDateString()}
											</small>
										)}
									</p>
									<p className="card-text article-excerpt mb-3">
										{article.description
											? article.description.length > 150
												? `${article.description.substring(0, 150)}...`
												: article.description
											: "No description available."}
									</p>
									<button
										className="btn btn-primary mt-auto"
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
				<p>Không có bài viết về Recipes.</p>
			)}

			<Pagination
				itemsPerPage={itemsPerPage}
				totalItems={articles.length}
				currentPage={currentPage}
				paginate={paginate}
			/>
		</>
	);

	// Render chi tiết Recipes (detail view)
	const renderArticleDetail = () => {
		if (!selectedArticle) return null;

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
					<ContentRenderer content={selectedArticle.content} />
				</div>
			</div>
		);
	};

	if (loading) {
		return (
			<div className="container mt-5">
				<div className="text-center">
					<div className="spinner-border" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
					<p className="mt-2">Đang tải bài viết...</p>
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
