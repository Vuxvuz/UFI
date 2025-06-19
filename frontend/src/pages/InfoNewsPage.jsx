import React, { useState, useEffect } from "react";
import axios from "axios";
import {
	Container,
	Row,
	Col,
	Card,
	Button,
	Form,
	InputGroup,
} from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import "./InfoNewsPage.css";

const InfoNewsPage = () => {
	const [news, setNews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	useEffect(() => {
		fetchNews();
	}, [currentPage, searchTerm]);

	const fetchNews = async () => {
		try {
			setLoading(true);
			const response = await axios.get(
				`/api/news?page=${currentPage - 1}&search=${searchTerm}`,
			);
			setNews(response.data.content);
			setTotalPages(response.data.totalPages);
			setLoading(false);
		} catch (err) {
			setError("Failed to fetch news. Please try again later.");
			setLoading(false);
		}
	};

	const handleSearch = (e) => {
		e.preventDefault();
		setCurrentPage(1);
		fetchNews();
	};

	const formatDate = (dateString) => {
		const options = { year: "numeric", month: "long", day: "numeric" };
		return new Date(dateString).toLocaleDateString(undefined, options);
	};

	const handlePageChange = (newPage) => {
		setCurrentPage(newPage);
	};

	return (
		<Container className="news-container py-4">
			<h1 className="text-center mb-4 news-title">Health News</h1>

			<Row className="mb-4">
				<Col md={{ span: 6, offset: 3 }}>
					<Form onSubmit={handleSearch}>
						<InputGroup className="search-bar">
							<Form.Control
								type="text"
								placeholder="Search for health topics..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="search-input"
							/>
							<Button variant="primary" type="submit" className="search-button">
								<FaSearch />
								<span className="ms-2 d-none d-md-inline">Search</span>
							</Button>
						</InputGroup>
					</Form>
				</Col>
			</Row>

			{loading ? (
				<div className="text-center">
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			) : error ? (
				<div className="alert alert-danger" role="alert">
					{error}
				</div>
			) : (
				<>
					<h2 className="mb-4 news-section-title">Latest Health News</h2>
					<Row>
						{news.map((article) => (
							<Col key={article.id} lg={6} className="mb-4">
								<Card className="h-100 news-item">
									{article.imageUrl && (
										<Card.Img
											variant="top"
											src={article.imageUrl}
											alt={article.title}
											className="news-image"
										/>
									)}
									<Card.Body>
										<Card.Title className="news-article-title">
											{article.title}
										</Card.Title>
										<Card.Subtitle className="mb-2 text-muted news-date">
											{formatDate(article.publishedAt)}
										</Card.Subtitle>
										<Card.Text className="news-description">
											{article.description}
										</Card.Text>
										<Button
											variant="outline-primary"
											href={article.url}
											target="_blank"
											rel="noopener noreferrer"
											className="news-read-more"
										>
											Read More
										</Button>
									</Card.Body>
								</Card>
							</Col>
						))}
					</Row>

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="d-flex justify-content-center mt-4">
							<ul className="pagination">
								<li
									className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
								>
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
				</>
			)}
		</Container>
	);
};

export default InfoNewsPage;
