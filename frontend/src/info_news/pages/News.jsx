// src/info_news/pages/News.jsx

import React, { useEffect, useState } from "react";
import { API } from "../../services/api";
import Pagination from "../components/Pagination"; // Import component phân trang
import "./News.css"; // File CSS đã có (news-card, news-img, placeholder-img, ...)

export default function NewsFullPage() {
	const [articles, setArticles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// Dùng để phân trang
	const [currentPage, setCurrentPage] = useState(1);
	const articlesPerPage = 9; // Số bài trên mỗi trang (có thể chỉnh số này)

	useEffect(() => {
		const fetchAllNews = async () => {
			try {
				setLoading(true);
				// Gọi endpoint backend: /api/newsapi/latest
				const response = await API.get("/api/newsapi/latest");
				setArticles(response.data.data || []);
			} catch (err) {
				console.error("Error fetching full news list:", err);
				setError("Không thể tải danh sách đầy đủ. Vui lòng thử lại sau.");
			} finally {
				setLoading(false);
			}
		};

		fetchAllNews();
	}, []);

	// Hàm rút gọn mô tả (nếu quá dài)
	const truncateText = (text, maxLength = 100) => {
		if (!text) return "";
		return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
	};

	// Tính toán để lấy mảng các bài trong trang hiện tại
	const indexOfLastArticle = currentPage * articlesPerPage; // ví dụ page 1 => 9, page 2 => 18
	const indexOfFirstArticle = indexOfLastArticle - articlesPerPage; // page 1 => 0, page 2 => 9
	const currentArticles = articles.slice(
		indexOfFirstArticle,
		indexOfLastArticle,
	);

	// Khi click số trang hoặc next/prev
	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	return (
		<div className="container mt-5 mb-5">
			<h1 className="mb-4 text-center">All Health News</h1>

			{loading && (
				<div className="text-center">
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			)}

			{error && (
				<div className="alert alert-danger text-center" role="alert">
					{error}
				</div>
			)}

			{!loading && !error && articles.length > 0 ? (
				<>
					<div className="row">
						{currentArticles.map((article, idx) => (
							<div
								key={indexOfFirstArticle + idx}
								className="col-12 col-md-6 col-lg-4 mb-4"
							>
								<div className="card h-100 news-card shadow-sm">
									<div className="position-relative">
										{/* Hiển thị thứ tự bài viết tính từ cả mảng */}
										<span className="position-absolute badge bg-primary top-0 start-0 ms-2 mt-2">
											{indexOfFirstArticle + idx + 1}
										</span>

										{/* Hình đại diện (nếu có), nếu không có ảnh thì show placeholder */}
										{article.urlToImage ? (
											<img
												src={article.urlToImage}
												className="card-img-top news-img"
												alt={article.title}
											/>
										) : (
											<div className="card-img-top placeholder-img d-flex align-items-center justify-content-center">
												No Image
											</div>
										)}
									</div>

									<div className="card-body d-flex flex-column">
										<h5 className="card-title">
											<a
												href={article.url}
												target="_blank"
												rel="noopener noreferrer"
												className="text-decoration-none text-dark"
											>
												{truncateText(article.title, 60)}
											</a>
										</h5>

										{/* Mô tả ngắn */}
										{article.description && (
											<p className="card-text flex-grow-1">
												{truncateText(article.description, 100)}
											</p>
										)}

										{/* Thông tin nhỏ về ngày tháng và nguồn */}
										<div className="mt-auto">
											<small className="text-muted d-block">
												{new Date(article.publishedAt).toLocaleString()}
											</small>
											<small className="text-secondary">
												Source: {article.source || "Unknown"}
											</small>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Component phân trang */}
					<Pagination
						itemsPerPage={articlesPerPage}
						totalItems={articles.length}
						currentPage={currentPage}
						paginate={paginate}
						pageIdPrefix="news-full"
					/>
				</>
			) : (
				!loading && <p className="text-center">No health news available.</p>
			)}
		</div>
	);
}
