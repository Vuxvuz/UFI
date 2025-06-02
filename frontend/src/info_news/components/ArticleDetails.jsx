// src/info_news/pages/ArticleDetails.jsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API } from '../../services/api';
import '../pages/NewsPage.css';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const fetchArticleDetail = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/api/articles/${id}`);
        if (response.data && response.data.data) {
          setArticle(response.data.data);
        } else {
          setError('No article data received.');
        }
      } catch (err) {
        console.error('Error fetching article details:', err);
        setError('Cannot load article details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading article...</p>
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
        <Link to="/info-news" className="btn btn-primary">Back to News</Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning" role="alert">
          Article not found.
        </div>
        <Link to="/info-news" className="btn btn-primary">Back to News</Link>
      </div>
    );
  }

  const categoryPath = article.category ? article.category.toLowerCase() : '';
  const displayDate  = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString()
    : 'Unknown date';
  const author = article.author || 'Unknown author';

  // Tách content thành các "chunk" dựa trên 2 ngắt dòng
  const contentChunks = article.content
    ? article.content.split('\n\n').filter(chunk => chunk.trim() !== '')
    : ['No content available.'];

  // Hàm renderContent (copy nguyên hàm đã đề cập bên trên)
  const renderContent = (chunk, index) => {
    const text = chunk.trim();

    // 1) Heading + đoạn văn sau
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
      // Tách header
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

    // 3) Danh sách nếu bắt đầu bằng '*'
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

    // 4) Fallback: paragraph
    return <p key={index} className="mt-3">{text}</p>;
  };

  return (
    <div className="container mt-5">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/info-news">News</Link>
          </li>
          {article.category && (
            <li className="breadcrumb-item">
              <Link to={`/info-news/${categoryPath}`}>{article.category}</Link>
            </li>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {article.title}
          </li>
        </ol>
      </nav>

      <div className="card mb-4">
        <div className="card-body">
          <h1 className="card-title mb-3">{article.title}</h1>
          <div className="d-flex justify-content-between mb-3">
            <span className="text-muted">
              <i className="far fa-calendar-alt me-1" />
              {displayDate}
            </span>
            {article.category && (
              <span className="badge bg-secondary">{article.category}</span>
            )}
          </div>
          <p className="text-muted">
            <strong>Author:</strong> {author}
          </p>

          {article.imageUrl && (
            <img
              src={article.imageUrl}
              className="img-fluid rounded mb-4"
              alt={article.title}
            />
          )}

          {/* Phần chính: chạy qua từng chunk và gọi renderContent */}
          <div className="article-content">
            {contentChunks.map((chunk, idx) => renderContent(chunk, idx))}
          </div>

          {article.source && (
            <div className="mt-4">
              <p className="text-muted">
                <strong>Source:</strong>{' '}
                <a href={article.source} target="_blank" rel="noopener noreferrer">
                  {article.source}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between">
        {article.category && (
          <Link to={`/info-news/${categoryPath}`} className="btn btn-outline-primary">
            <i className="fas fa-arrow-left me-1" />
            Back to {article.category}
          </Link>
        )}
        <Link to="/info-news" className="btn btn-primary">
          <i className="fas fa-home me-1" />
          Back to News
        </Link>
      </div>
    </div>
  );
}
