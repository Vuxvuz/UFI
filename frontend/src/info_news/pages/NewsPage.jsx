// src/info_news/pages/NewsPage.jsx

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import axios from "axios";
import "./NewsPage.css";
import { API } from "../../services/api";

// ===================================
//  PubMed API (unchanged)
// ===================================
async function fetchPubMedResults(term) {
	try {
		const response = await axios.get(
			"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
			{
				params: { db: "pubmed", term, retmode: "json", retmax: 5 },
			},
		);
		const ids = response.data.esearchresult.idlist;
		if (ids.length === 0) return [];
		const summaryResponse = await axios.get(
			"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
			{
				params: { db: "pubmed", id: ids.join(","), retmode: "json" },
			},
		);
		const summaries = Object.values(summaryResponse.data.result).filter(
			(item) => item.uid,
		);
		return summaries.map((item) => ({
			id: item.uid,
			title: item.title,
			link: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
			snippet: item.source || "",
			source: "PubMed",
		}));
	} catch (error) {
		console.error("Error fetching PubMed results:", error);
		return [];
	}
}

// ===================================
//  Validate that a key exists in categoryCounts
// ===================================
function validateCategoryCount(key, counts) {
	if (!(key in counts)) {
		console.error(
			`⚠ Backend counts missing key: '${key}'. Received keys:`,
			Object.keys(counts),
		);
		return "⚠ Error";
	}
	return counts[key];
}

export default function NewsPage() {
	// ===== Latest News (from NewsAPI) =====
	const [latestArticles, setLatestArticles] = useState([]);
	const [newsLoading, setNewsLoading] = useState(true);
	const [newsError, setNewsError] = useState(null);

	// ===== Category counts =====
	const [categoryCounts, setCategoryCounts] = useState({});

	// ===== Search state =====
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showGoogleSearch, setShowGoogleSearch] = useState(false);

	useEffect(() => {
		// 1) Fetch counts for badges
		const fetchCounts = async () => {
			try {
				const countsResponse = await API.get("/api/articles/stats/counts");
				const countsData = countsResponse.data.data || {};
				setCategoryCounts(countsData);
			} catch (err) {
				console.error("[NewsPage] Error fetching counts:", err);
				setCategoryCounts({});
			}
		};

		// 2) Fetch latest health news
		const fetchLatestNews = async () => {
			try {
				setNewsLoading(true);
				const newsApiResponse = await API.get("/api/newsapi/latest");
				const articles = newsApiResponse.data.data || [];
				setLatestArticles(articles.slice(0, 4));
			} catch (err) {
				console.error("[NewsPage] Error fetching NewsAPI/latest:", err);
				setNewsError("Cannot load latest news");
				setLatestArticles([]);
			} finally {
				setNewsLoading(false);
			}
		};

		fetchCounts();
		fetchLatestNews();
	}, []);

	// When showGoogleSearch becomes true, inject Google CSE script
	useEffect(() => {
		if (showGoogleSearch) {
			const scriptId = "google-cse-script";
			if (!document.getElementById(scriptId)) {
				const script = document.createElement("script");
				script.id = scriptId;
				script.src = "https://cse.google.com/cse.js?cx=97dd7a48eba864e90";
				script.async = true;
				document.body.appendChild(script);
			}
		}
	}, [showGoogleSearch]);

	// ===== Handle “Search” button =====
	const handleSearch = async (e) => {
		e.preventDefault();
		if (!searchTerm.trim()) return;

		setIsSearching(true);
		setSearchResults([]);
		setShowGoogleSearch(false);

		try {
			// 1) Call local search + PubMed concurrently
			const [localResponse, pubmedResults] = await Promise.all([
				API.get(`/api/articles/search?query=${encodeURIComponent(searchTerm)}`),
				fetchPubMedResults(searchTerm),
			]);

			// 2) Ensure localResponse.data.data is an array
			const backendArray = Array.isArray(localResponse.data.data)
				? localResponse.data.data
				: [];

			// 3) Tag each local result with source = 'Local'
			const localResults = backendArray.map((item) => ({
				...item,
				source: "Local",
			}));

			// 4a) If local returned results, show them
			if (localResults.length > 0) {
				setSearchResults(localResults);
				setIsSearching(false);
				return;
			}

			// 4b) If local is empty but PubMed has results, show PubMed
			if (pubmedResults.length > 0) {
				setSearchResults(pubmedResults);
				setIsSearching(false);
				return;
			}

			// 4c) If both are empty, use Google CSE
			setShowGoogleSearch(true);
		} catch (err) {
			console.error("[NewsPage] Error searching articles:", err);
			// On error, fall back to Google CSE
			setShowGoogleSearch(true);
		} finally {
			setIsSearching(false);
		}
	};

	// ===== Clear entire search =====
	const clearSearch = () => {
		setSearchTerm("");
		setSearchResults([]);
		setIsSearching(false);
		setShowGoogleSearch(false);
	};

	return (
		<div className="container mt-5">
			<h1 className="mb-4">Health News</h1>

			{/* ===== Search Bar ===== */}
			<div className="row mb-4">
				<div className="col-12">
					<div className="card">
						<div className="card-body">
							<form onSubmit={handleSearch} className="d-flex">
								<input
									type="text"
									className="form-control me-2"
									placeholder="Search for health topics..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
								<button type="submit" className="btn btn-primary">
									<i className="fas fa-search" /> Search
								</button>
								{(searchResults.length > 0 || showGoogleSearch) && (
									<button
										type="button"
										className="btn btn-secondary ms-2"
										onClick={clearSearch}
									>
										Clear
									</button>
								)}
							</form>
						</div>
					</div>
				</div>
			</div>

			{/* ===== Spinner when searching ===== */}
			{isSearching && (
				<div className="row mb-4">
					<div className="col-12 text-center">
						<i className="fas fa-spinner fa-spin" /> Searching...
					</div>
				</div>
			)}

			{/* ===== Local or PubMed search results ===== */}
			{searchResults.length > 0 && (
				<div className="row mb-5">
					<div className="col-12">
						<div className="card">
							<div className="card-body">
								<h2 className="card-title">Search Results</h2>
								<p>
									Found {searchResults.length} result
									{searchResults.length > 1 ? "s" : ""} for “{searchTerm}”
								</p>
								{searchResults.map((article, idx) => (
									<div key={idx} className="mb-3">
										<h5>
											{article.source === "Local" ? (
												<Link to={`/article/${article.id}`}>
													{article.title}
												</Link>
											) : (
												<a
													href={article.link}
													target="_blank"
													rel="noopener noreferrer"
												>
													{article.title}
												</a>
											)}
										</h5>
										{article.snippet && <p>{article.snippet}</p>}
										<span className="badge bg-secondary">{article.source}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ===== If no local/PubMed results ⇒ show Google CSE ===== */}
			{showGoogleSearch && (
				<div className="row mb-5">
					<div className="col-12">
						<div className="card google-search-container">
							<div className="card-body">
								<h2 className="card-title">No Local or PubMed Results</h2>
								<p>
									We couldn’t find a match locally or on PubMed. Try searching
									via Google below:
								</p>
								<div className="gcse-search"></div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ===== If not searching and not showing Google CSE, show Latest + Topics ===== */}
			{!isSearching && !showGoogleSearch && (
				<>
					{/* ===== Latest Health News ===== */}
					<div className="row mb-5">
						<div className="col-12">
							<div className="card">
								<div className="card-body">
									<h2 className="card-title">Latest Health News</h2>

									{newsLoading && <p>Loading latest articles...</p>}
									{newsError && <p className="text-danger">{newsError}</p>}

									{!newsLoading && !newsError && latestArticles.length > 0 && (
										<ul className="list-group mb-3">
											{latestArticles.map((article, idx) => (
												<li key={idx} className="list-group-item">
													<a
														href={article.url}
														target="_blank"
														rel="noopener noreferrer"
														className="d-block h5 mb-1"
													>
														{article.title}
													</a>
													<div
														className="text-muted"
														style={{ fontSize: "0.85em" }}
													>
														{new Date(article.publishedAt).toLocaleString()}
													</div>
												</li>
											))}
										</ul>
									)}

									{!newsLoading &&
										!newsError &&
										latestArticles.length === 0 && (
											<p>No latest articles available.</p>
										)}

									<div className="text-end">
										<Link
											to="/info-news/full-news"
											className="btn btn-sm btn-primary"
										>
											See More
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* ===== Health Topics Section ===== */}
					<h2 className="mb-4">Health Topics</h2>
					<div className="row row-cols-1 row-cols-md-2 g-4 mb-5">
						{/* Drugs & Supplements */}
						<CategoryCard
							title="Drugs & Supplements"
							description="Prescription drugs, OTC medicines, herbs, and supplements"
							icon="fas fa-pills"
							color="bg-success"
							link="/info-news/drug"
							count={validateCategoryCount("drug&supplement", categoryCounts)}
						/>

						{/* Mental Health */}
						<CategoryCard
							title="Mental Health"
							description="Depression, anxiety, stress, and mental wellness"
							icon="fas fa-brain"
							color="bg-info"
							link="/info-news/mental"
							count={validateCategoryCount("mental", categoryCounts)}
						/>

						{/* Nutrition */}
						<CategoryCard
							title="Nutrition"
							description="Nutrition info, dietary guidelines, and health benefits"
							icon="fas fa-apple-alt"
							color="bg-warning"
							link="/info-news/nutrition"
							count={validateCategoryCount("nutrition", categoryCounts)}
						/>

						{/* Healthy Recipes */}
						<CategoryCard
							title="Healthy Recipes"
							description="A collection of healthy recipes"
							icon="fas fa-utensils"
							color="bg-danger"
							link="/info-news/diet"
							count={validateCategoryCount("recipes", categoryCounts)}
						/>

						{/* Health */}
						{/* <CategoryCard
              title="Health"
              description="General health: prevention, treatments, and lifestyle"
              icon="fas fa-heartbeat"
              color="bg-primary"
              link="/info-news/health"
              count={validateCategoryCount('health', categoryCounts)}
            /> */}

						{/* Diseases */}
						{/* <CategoryCard
              title="Diseases"
              description="Information on diseases: symptoms, diagnosis, and care"
              icon="fas fa-procedures"
              color="bg-secondary"
              link="/info-news/diseases"
              count={validateCategoryCount('disease', categoryCounts)}
            /> */}

						{/* General Health */}
						{/* <CategoryCard
              title="General Health"
              description="Everyday health topics: prevention and wellness tips"
              icon="fas fa-heart"
              color="bg-primary"
              link="/info-news/general"
              count={validateCategoryCount('general', categoryCounts)}
            /> */}

						{/* Symptoms */}
						{/* <CategoryCard
              title="Symptoms"
              description="Learn about symptom overview, causes, and self-care"
              icon="fas fa-notes-medical"
              color="bg-danger"
              link="/info-news/symptoms"
              count={validateCategoryCount('symptoms', categoryCounts)}
            /> */}
					</div>
				</>
			)}
		</div>
	);
}

// ====================================
//  CategoryCard component
// ====================================
function CategoryCard({ title, description, icon, color, link, count }) {
	const isError = typeof count === "string" && count.startsWith("⚠");
	return (
		<div className="col">
			<div className="card h-100">
				<div className="card-body d-flex align-items-start">
					<div
						className={`icon-container ${color} text-white p-3 rounded me-3`}
						style={{ minWidth: "60px", minHeight: "60px" }}
					>
						<i className={`${icon} fa-2x`} />
					</div>
					<div className="flex-grow-1 d-flex flex-column justify-content-between">
						<div>
							<h5 className="card-title">{title}</h5>
							<p className="card-text">{description}</p>
						</div>
						<div className="d-flex justify-content-between align-items-center">
							<Link to={link} className="btn btn-outline-primary">
								Learn More
							</Link>
							<span
								className={`badge ${isError ? "bg-danger" : "bg-secondary"}`}
							>
								{count} {isError ? "" : "articles"}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

CategoryCard.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	icon: PropTypes.string.isRequired,
	color: PropTypes.string.isRequired,
	link: PropTypes.string.isRequired,
	count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
