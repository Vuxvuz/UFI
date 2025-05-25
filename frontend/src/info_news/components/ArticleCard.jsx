// frontend/src/info_news/components/ArticleCard.jsx
import React from 'react';

export default function ArticleCard({ article }) {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title">{article.title}</h5>
        <p className="card-text">{article.description}</p>
        <a href={article.link} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
          Read more
        </a>
      </div>
    </div>
  );
}