// src/info_news/pages/Health.jsx

import React, { useEffect, useState } from 'react';
import { API } from '../../services/api';
import './NewsPage.css';     // CSS chung cho Info News
import Pagination from '../components/Pagination';

export default function Health() {
  const [articles, setArticles]              = useState([]);
  const [loading, setLoading]                = useState(true);
  const [error, setError]                    = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [viewMode, setViewMode]              = useState('list');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        // Gọi endpoint lấy category "health"
        const response = await API.get('/api/articles', {
          params: { category: 'health' }
        });
        setArticles(response.data.data || []);
      } catch (err) {
        console.error('Error fetching health articles:', err);
        setError('Cannot load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // Hàm renderContent (như đã mô tả)
  const renderContent = (chunk, index) => {
    const text = chunk.trim();

    // 1) Heading + đoạn văn
    if (text.startsWith('**')) {
      const closingIndex = text.indexOf('**', 2);
      if (closingIndex > 1) {
        const headingText = text.substring(2, closingIndex).trim();
        const remaining   = text.substring(closingIndex + 2).trim();
        return (
          <React.Fragment key={index}>
            <h2 className="mt-4">{headingText}</h2>
            {remaining && <p className="mt-3">{remaining}</p>}
          </React.Fragment>
        );
      }
    }

    // 2) Table Markdown
    const lines = text.split('\n').map(l => l.trim());
    if (
      lines.length >= 2 &&
      lines[0].includes('|') &&
      lines[1].match(/^[-\s|:]+$/)
    ) {
      const headers = lines[0]
        .split('|')
        .map(h => h.trim())
        .filter(h => h !== '');
      const dataRows = lines.slice(2);

      return (
        <table key={index} className="table table-bordered mt-3">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rIdx) => {
              const cols = row
                .split('|')
                .map(c => c.trim())
                .filter(c => c !== '');
              return (
                <tr key={rIdx}>
                  {cols.map((c, cIdx) => (
                    <td key={cIdx}>{c}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    // 3) Danh sách
    if (text.startsWith('*')) {
      const items = lines
        .filter(l => l.startsWith('*'))
        .map(l => l.replace(/^\*\s*/, ''));
      return (
        <ul key={index} className="mt-3">
          {items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    }

    // 4) Paragraph
    return <p key={index} className="mt-3">{text}</p>;
  };

  // Chuyển list ↔ detail
  const showArticleDetail = (article) => {
    setSelectedArticle(article);
    setViewMode('detail');
    window.scrollTo(0, 0);
  };
  const backToList = () => {
    setViewMode('list');
    setSelectedArticle(null);
  };

  // Phân trang cho list
  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentArticles  = articles.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  // Render list Health
  const renderArticlesList = () => (
    <>
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card category-card">
            <div className="card-body d-flex align-items-center">
              <div className="category-icon bg-info text-white p-3 rounded me-3">
                <i className="fas fa-brain fa-2x"></i>
              </div>
              <div>
                <h3 className="card-title">
                  Depression, anxiety, stress, and mental wellness information
                </h3>
                <p className="card-text">
                  Learn about mental health conditions, treatments, and ways to support your mental well-being.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentArticles.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {currentArticles.map((article, idx) => (
            <div className="col" key={article.id || `health-${idx}`}>
              <div className="card h-100 article-card">
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    className="card-img-top article-image"
                    alt={article.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                )}
                <div className="card-body">
                  <h5
                    className="card-title"
                    style={{ cursor: 'pointer' }}
                    onClick={() => showArticleDetail(article)}
                  >
                    {article.title}
                  </h5>
                  <p className="card-text text-muted">
                    {article.publishedDate && (
                      <small>{new Date(article.publishedDate).toLocaleDateString()}</small>
                    )}
                  </p>
                  <p className="card-text article-excerpt">
                    {article.description
                      ? article.description.length > 150
                        ? `${article.description.substring(0, 150)}...`
                        : article.description
                      : 'No description available.'}
                  </p>
                  <button className="btn btn-primary" onClick={() => showArticleDetail(article)}>
                    Read More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No Articles.</p>
      )}

      <Pagination 
        itemsPerPage={itemsPerPage}
        totalItems={articles.length}
        currentPage={currentPage}
        paginate={paginate}
      />
    </>
  );

  // Render detail Health (đọc Markdown)
  const renderArticleDetail = () => {
    if (!selectedArticle) return null;
    const contentChunks = selectedArticle.content
      ? selectedArticle.content.split('\n\n').filter(chunk => chunk.trim() !== '')
      : ['No content available.'];

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
      {viewMode === 'list' ? renderArticlesList() : renderArticleDetail()}
    </div>
  );
}
