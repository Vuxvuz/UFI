// frontend/src/info_news/components/ArticleList.jsx
import React from 'react';
import ArticleCard from './ArticleCard';

export default function ArticleList({ articles }) {
  return (
    <div className="row">
      {articles.map((article) => (
        <div key={article.id} className="col-md-4">
          <ArticleCard article={article} />
        </div>
      ))}
    </div>
  );
}