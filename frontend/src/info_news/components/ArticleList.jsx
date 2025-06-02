// frontend/src/info_news/components/ArticleList.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function ArticleList({ articles }) {
  if (!articles || articles.length === 0) {
    return <p>No articles.</p>;
  }

  return (
    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      {articles.map((article) => (
        <div className="col" key={article.id}>
          <div className="card h-100">
            {article.imageUrl && (
              <img 
                src={article.imageUrl} 
                className="card-img-top" 
                alt={article.title}
                style={{ height: '180px', objectFit: 'cover' }}
              />
            )}
            <div className="card-body">
              <h5 className="card-title">{article.title}</h5>
              <p className="card-text">
                {article.content ? (
                  article.content.substring(0, 150) + '...'
                ) : (
                  'No content.'
                )}
              </p>
              <div className="d-flex justify-content-between align-items-center">
                <Link 
                  to={article.id ? `/article/${article.id}` : '#'}
                  className="btn btn-primary"
                >
                  Read more
                </Link>
                <small className="text-muted">{new Date(article.createdAt).toLocaleDateString()}</small>
              </div>
            </div>
            <div className="card-footer text-muted">
              <small>Category: {article.category}</small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}