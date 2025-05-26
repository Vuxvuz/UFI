import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './NewsPage.css';
import ArticleList from '../components/ArticleList';
import { API } from '../../services/api';

// PubMed API
async function fetchPubMedResults(term) {
  try {
    const response = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
      params: { db: 'pubmed', term, retmode: 'json', retmax: 5 }
    });
    const ids = response.data.esearchresult.idlist;
    if (ids.length === 0) return [];
    const summaryResponse = await axios.get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
      params: { db: 'pubmed', id: ids.join(','), retmode: 'json' }
    });
    const summaries = Object.values(summaryResponse.data.result).filter(item => item.uid);
    return summaries.map(item => ({
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

export default function NewsPage() {
  const [latestArticles, setLatestArticles] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const whoNewsResponse = await API.get('/api/who/news');
        const countsResponse = await API.get('/api/articles/counts');
        setLatestArticles(whoNewsResponse.data.data || []);
        setCategoryCounts(countsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu từ WHO. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load Google CSE script only when needed
  useEffect(() => {
    if (showGoogleSearch) {
      const scriptId = 'google-cse-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cse.google.com/cse.js?cx=97dd7a48eba864e90';  // <-- Replace with your Google CSE CX
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [showGoogleSearch]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setShowGoogleSearch(false);

    try {
      const [localResponse, pubmedResults] = await Promise.all([
        API.get(`/api/articles/search?query=${encodeURIComponent(searchTerm)}`),
        fetchPubMedResults(searchTerm)
      ]);

      const combinedResults = [
        ...localResponse.data.map(item => ({ ...item, source: 'Local' })),
        ...pubmedResults
      ];

      if (combinedResults.length === 0) {
        setShowGoogleSearch(true);
      } else {
        setSearchResults(combinedResults);
      }
    } catch (error) {
      console.error('Error searching articles:', error);
      setError('Không thể tìm kiếm. Vui lòng thử lại sau.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
    setShowGoogleSearch(false);
    setError(null);
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Health News</h1>

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
                  <i className="fas fa-search"></i> Search
                </button>
                {(searchResults.length > 0 || showGoogleSearch) && (
                  <button type="button" className="btn btn-secondary ms-2" onClick={clearSearch}>
                    Clear
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {isSearching && (
        <div className="row mb-4">
          <div className="col-12 text-center">
            <i className="fas fa-spinner fa-spin"></i> Searching...
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="row mb-5">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title">Search Results</h2>
                <p>Found {searchResults.length} results for "{searchTerm}"</p>
                {searchResults.map(article => (
                  <div key={`${article.source}-${article.id}`} className="mb-3">
                    <h5>
                      <a href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a>
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

      {showGoogleSearch && (
        <div className="row mb-5">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title">Google Search Results</h2>
                <p>No local or PubMed results found. Try searching on Google below:</p>
                <div className="gcse-search"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!searchResults.length && !showGoogleSearch && !isSearching && (
        <>
          <div className="row mb-5">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">Latest Health News</h2>
                  {loading && <p>Đang tải bài viết mới nhất...</p>}
                  {error && <p className="text-danger">{error}</p>}
                  {!loading && !error && latestArticles.length > 0 ? (
                    <ArticleList articles={latestArticles} />
                  ) : (
                    <p>Không có bài viết mới.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <h2 className="mb-4">Health Topics</h2>
          <div className="row row-cols-1 row-cols-md-2 g-4 mb-5">
            <CategoryCard
              title="Drugs & Supplements"
              description="Prescription drugs, over-the-counter medicines, herbs, and supplements"
              icon="fas fa-pills"
              color="bg-success"
              link="/info-news/diseases"
              count={categoryCounts.drug || 0}
            />
            <CategoryCard
              title="Mental Health"
              description="Depression, anxiety, stress, and mental wellness information"
              icon="fas fa-brain"
              color="bg-info"
              link="/info-news/mental"
              count={categoryCounts.mind || 0}
            />
            <CategoryCard
              title="Nutrition"
              description="Explore nutrition information, dietary guidelines, and health benefits"
              icon="fas fa-apple-alt"
              color="bg-warning"
              link="/info-news/nutrition"
              count={categoryCounts.nutrition || 0}
            />
            <CategoryCard
              title="Healthy Recipes"
              description="These recipes show you how to prepare tasty, quick meals as part of a healthy lifestyle"
              icon="fas fa-utensils"
              color="bg-danger"
              link="/info-news/diet"
              count={categoryCounts.recipe || 0}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CategoryCard({ title, description, icon, color, link, count }) {
  return (
    <div className="col">
      <div className="card h-100">
        <div className="card-body d-flex">
          <div className={`icon-container ${color} text-white p-3 rounded me-3`}>
            <i className={`${icon} fa-2x`}></i>
          </div>
          <div>
            <h5 className="card-title">{title}</h5>
            <p className="card-text">{description}</p>
            <div className="d-flex justify-content-between align-items-center">
              <Link to={link} className="btn btn-outline-primary">Learn More</Link>
              <span className="badge bg-secondary">{count} articles</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
