// src/info_news/pages/NewsPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './NewsPage.css';
import { API } from '../../services/api';

// === Phần PubMed API (không đổi) ===
async function fetchPubMedResults(term) {
  try {
    const response = await axios.get(
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
      {
        params: { db: 'pubmed', term, retmode: 'json', retmax: 5 }
      }
    );
    const ids = response.data.esearchresult.idlist;
    if (ids.length === 0) return [];
    const summaryResponse = await axios.get(
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',
      {
        params: { db: 'pubmed', id: ids.join(','), retmode: 'json' }
      }
    );
    const summaries = Object.values(summaryResponse.data.result).filter(
      (item) => item.uid
    );
    return summaries.map((item) => ({
      id: item.uid,
      title: item.title,
      link: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
      snippet: item.source || '',
      source: 'PubMed'
    }));
  } catch (error) {
    console.error('Error fetching PubMed results:', error);
    return [];
  }
}

// === Hàm kiểm tra key trong counts ===
function validateCategoryCount(key, counts) {
  if (!(key in counts)) {
    console.error(
      `⚠ Backend counts missing key: '${key}'. Received keys:`,
      Object.keys(counts)
    );
    return '⚠ Error: Key missing';
  }
  return counts[key];
}

export default function NewsPage() {
  // State cho phần Latest News (từ NewsAPI)
  const [latestArticles, setLatestArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  // State cho phần thống kê số lượng bài theo category
  const [categoryCounts, setCategoryCounts] = useState({});

  // State cho search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);

  useEffect(() => {
    // 1) Fetch counts trước, để badge luôn có data (dù NewsAPI đang lỗi)
    const fetchCounts = async () => {
      try {
        const countsResponse = await API.get('/api/articles/stats/counts');
        const countsData = countsResponse.data.data || {};
        setCategoryCounts(countsData);
      } catch (err) {
        console.error('[NewsPage] Lỗi khi fetch counts:', err);
        setCategoryCounts({});
      }
    };

    // 2) Fetch latest articles từ NewsAPI
    const fetchLatestNews = async () => {
      try {
        setNewsLoading(true);
        const newsApiResponse = await API.get('/api/newsapi/latest');
        const articles = newsApiResponse.data.data || [];
        // Lấy 4 bài đầu tiên để hiển thị phần “Latest News”
        setLatestArticles(articles.slice(0, 4));
      } catch (err) {
        console.error('[NewsPage] Lỗi khi fetch NewsAPI/latest:', err);
        setNewsError('Cannot load latest news');
        setLatestArticles([]);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchCounts();
    fetchLatestNews();
  }, []);

  // Mỗi khi showGoogleSearch = true, inject script Google CSE
  useEffect(() => {
    if (showGoogleSearch) {
      const scriptId = 'google-cse-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cse.google.com/cse.js?cx=97dd7a48eba864e90';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [showGoogleSearch]);

  // Xử lý search form
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setShowGoogleSearch(false);

    try {
      // Gọi local search + PubMed đồng thời
      const [localResponse, pubmedResults] = await Promise.all([
        API.get(`/api/articles/search?query=${encodeURIComponent(searchTerm)}`),
        fetchPubMedResults(searchTerm)
      ]);

      // localResponse.data là một mảng ArticleDTO
      const localResults = (localResponse.data || []).map((item) => ({
        ...item,
        source: 'Local'
      }));

      const combinedResults = [...localResults, ...pubmedResults];

      if (combinedResults.length === 0) {
        setShowGoogleSearch(true);
      } else {
        setSearchResults(combinedResults);
      }
    } catch (err) {
      console.error('[NewsPage] Error searching articles:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
    setShowGoogleSearch(false);
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Health News</h1>

      {/* === Search Bar === */}
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

      {/* === Spinner khi đang search === */}
      {isSearching && (
        <div className="row mb-4">
          <div className="col-12 text-center">
            <i className="fas fa-spinner fa-spin" /> Searching...
          </div>
        </div>
      )}

      {/* === Kết quả search nếu có === */}
      {searchResults.length > 0 && (
        <div className="row mb-5">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title">Search Results</h2>
                <p>
                  Found {searchResults.length} results for "{searchTerm}"
                </p>
                {searchResults.map((article, idx) => (
                  <div key={idx} className="mb-3">
                    <h5>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {article.title}
                      </a>
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

      {/* === Nếu không có kết quả local/pubmed, hiển thị Google CSE === */}
      {showGoogleSearch && (
        <div className="row mb-5">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title">Google Search Results</h2>
                <p>
                  No local or PubMed results found. Try searching on Google
                  below:
                </p>
                <div className="gcse-search"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Phần chính: Latest Health News + Health Topics === */}
      {!isSearching && !showGoogleSearch && (
        <>
          {/* === Latest Health News === */}
          <div className="row mb-5">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">Latest Health News</h2>

                  {newsLoading && <p>Loading latest articles...</p>}
                  {newsError && <p className="text-danger">{newsError}</p>}

                  {!newsLoading && !newsError && latestArticles.length > 0 ? (
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
                            style={{ fontSize: '0.85em' }}
                          >
                            {new Date(article.publishedAt).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {!newsLoading &&
                    !newsError &&
                    latestArticles.length === 0 && (
                      <p>No latest articles available.</p>
                    )}

                  <div className="text-end">
                    <Link to="/news/full" className="btn btn-sm btn-primary">
                      See More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === Health Topics Section === */}
          <h2 className="mb-4">Health Topics</h2>
          <div className="row row-cols-1 row-cols-md-2 g-4 mb-5">
            <CategoryCard
              title="Drugs & Supplements"
              description="Prescription drugs, over-the-counter medicines, herbs, and supplements"
              icon="fas fa-pills"
              color="bg-success"
              link="/info-news/drug"
              count={validateCategoryCount(
                'drug&supplement',
                categoryCounts
              )}
            />

            <CategoryCard
              title="Mental Health"
              description="Depression, anxiety, stress, and mental wellness information"
              icon="fas fa-brain"
              color="bg-info"
              link="/info-news/mental"
              count={validateCategoryCount('mental', categoryCounts)}
            />

            <CategoryCard
              title="Nutrition"
              description="Explore nutrition information, dietary guidelines, and health benefits"
              icon="fas fa-apple-alt"
              color="bg-warning"
              link="/info-news/nutrition"
              count={validateCategoryCount('nutrition', categoryCounts)}
            />

            <CategoryCard
              title="Healthy Recipes"
              description="Các công thức nấu ăn lành mạnh"
              icon="fas fa-utensils"
              color="bg-danger"
              link="/info-news/diet"
              count={validateCategoryCount('recipes', categoryCounts)}
            />
          </div>
        </>
      )}
    </div>
  );
}

// === Component CategoryCard ===
function CategoryCard({ title, description, icon, color, link, count }) {
  const isError = typeof count === 'string' && count.startsWith('⚠');
  return (
    <div className="col">
      <div className="card h-100">
        <div className="card-body d-flex">
          <div className={`icon-container ${color} text-white p-3 rounded me-3`}>
            <i className={`${icon} fa-2x`} />
          </div>
          <div>
            <h5 className="card-title">{title}</h5>
            <p className="card-text">{description}</p>
            <div className="d-flex justify-content-between align-items-center">
              <Link to={link} className="btn btn-outline-primary">
                Learn More
              </Link>
              <span
                className={`badge ${
                  isError ? 'bg-danger' : 'bg-secondary'
                }`}
              >
                {count} {isError ? '' : 'articles'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
