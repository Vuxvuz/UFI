// src/info_news/pages/Drug.jsx

import React, { useEffect, useState } from "react";
import { API } from "../../services/api";
import "./NewsPage.css";
import Pagination from "../components/Pagination";
import ContentRenderer from "../components/ContentRenderer";

export default function Drug() {
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
				// Gọi endpoint => category = "drug&supplement"
				const response = await API.get("/api/articles/drug%26supplement");
				if (response.data && response.data.data) {
					setArticles(response.data.data);
				} else {
					setError("No articles for Drugs & Supplements.");
				}
			} catch (err) {
				console.error("Error fetching drug articles:", err);
				setError("Unable to load Drugs & Supplements data. Please try again.");
			} finally {
				setLoading(false);
			}
		};
		fetchArticles();
	}, []);

	// Chuyển giữa list ↔ detail
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

	// Render danh sách Drugs & Supplements
	const renderArticlesList = () => (
		<>
			<h1 className="mb-4">Drugs & Supplements</h1>
			<div className="row mb-4">
				<div className="col-12">
					<div className="card category-card">
						<div className="card-body d-flex">
							<div className="category-icon bg-success text-white p-3 rounded me-3">
								<i className="fas fa-pills fa-2x"></i>
							</div>
							<div>
								<h3 className="card-title">
									Prescription drugs, over-the-counter medicines, herbs, and
									supplements
								</h3>
								<p className="card-text">
									Các thông tin chi tiết về thuốc, dược phẩm, thảo dược và thực
									phẩm chức năng.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{currentArticles.length > 0 ? (
				<div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
					{currentArticles.map((article, idx) => (
						<div className="col" key={article.id || `drug-${idx}`}>
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
									<p className="card-text article-excerpt mb-3">
										{article.summary
											? article.summary
											: article.content
												? `${article.content.substring(0, 150)}...`
												: "No excerpt available."}
									</p>
									<button
										className="btn btn-outline-primary mt-auto"
										onClick={() => showArticleDetail(article)}
									>
										Read more
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<p>No articles for Drugs & Supplements.</p>
			)}

			<Pagination
				itemsPerPage={itemsPerPage}
				totalItems={articles.length}
				currentPage={currentPage}
				paginate={paginate}
			/>
		</>
	);

	// Render chi tiết Drugs & Supplements
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
